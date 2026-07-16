<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DocumentGenerationService;
use App\Services\PaymentApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class VerifyMatssoReadiness extends Command
{
    protected $signature = 'matsso:verify {--api : Consultar también el backend de pagos}';

    protected $description = 'Verifica plantillas, almacenamiento, base de datos y pagos sin modificar datos';

    private array $results = [];

    public function handle(PaymentApiService $payments): int
    {
        $this->checkFiles();
        $databaseReady = $this->checkDatabase();
        $this->checkPaymentConfiguration($payments);

        $this->newLine();
        $this->table(['Comprobación', 'Estado', 'Detalle'], $this->results);

        $hasFailures = collect($this->results)->contains(fn (array $result) => $result[1] === 'FALLO');

        if (! $databaseReady) {
            $this->warn('No se ejecutó ni se modificó ningún dato. Configura o inicia PostgreSQL y repite el comando.');
        }

        return $hasFailures ? self::FAILURE : self::SUCCESS;
    }

    private function checkFiles(): void
    {
        $templateRoot = rtrim(config('matsso.template_path'), DIRECTORY_SEPARATOR);
        foreach (DocumentGenerationService::templates() as $template) {
            $path = $templateRoot.DIRECTORY_SEPARATOR.$template['file'];
            $this->record("Plantilla {$template['file']}", is_readable($path), is_readable($path) ? 'Legible' : 'No encontrada');
        }

        $storage = storage_path('app/private');
        $this->record('Storage privado', is_dir($storage) && is_writable($storage), $storage);
    }

    private function checkDatabase(): bool
    {
        try {
            DB::connection()->getPdo();
            $this->record('PostgreSQL', true, 'Conexión disponible');

            $contracts = [
                'usuarios_admin' => ['id', 'usuario', 'password_hash', 'rol', 'activo', 'nombre_completo', 'created_at'],
                'clientes' => ['id', 'nombre', 'cedula', 'telefono', 'correo', 'direccion', 'fecha', 'ciudad', 'lugar', 'esquema', 'tipo_examen', 'puntaje_teorico', 'puntaje_practico', 'datos_c02', 'created_at', 'updated_at'],
                'documentos_generados' => ['id', 'cliente_id', 'carpeta', 'zip_ruta', 'fecha_generacion', 'n_archivos', 'nombres_archivos', 'generado_por'],
            ];

            $validContracts = [];
            foreach ($contracts as $table => $columns) {
                $exists = Schema::hasTable($table) && Schema::hasColumns($table, $columns);
                $validContracts[$table] = $exists;
                $this->record("Contrato {$table}", $exists, $exists ? 'Columnas compatibles' : 'Faltan tabla o columnas');
            }

            if ($validContracts['usuarios_admin']) {
                $invalidRoles = DB::table('usuarios_admin')
                    ->whereNotIn('rol', [User::ROLE_ADMIN, User::ROLE_SECRETARY])
                    ->distinct()->pluck('rol')->filter()->values()->all();
                $this->record('Roles almacenados', $invalidRoles === [], $invalidRoles === [] ? 'Válidos' : implode(', ', $invalidRoles));
            } else {
                $this->record('Roles almacenados', false, 'No evaluado: falta usuarios_admin');
            }

            $uniqueCedula = collect(DB::select(
                "select indexdef from pg_indexes where schemaname = 'public' and tablename = 'clientes'",
            ))->contains(fn (object $index) => str_contains(mb_strtolower($index->indexdef), 'unique')
                && str_contains(mb_strtolower($index->indexdef), '(cedula)'));
            $this->record('Índice clientes.cedula', $uniqueCedula, $uniqueCedula ? 'Único' : 'No se encontró índice único');

            return true;
        } catch (Throwable $exception) {
            report($exception);
            $this->record('PostgreSQL', false, 'Conexión o contrato no disponible; revisa storage/logs');

            return false;
        }
    }

    private function checkPaymentConfiguration(PaymentApiService $payments): void
    {
        $configured = filled(config('matsso.backend_url')) && filled(config('matsso.admin_api_key'));
        $this->record('Configuración de pagos', $configured, $configured ? 'Variables presentes' : 'Falta BACKEND_URL o ADMIN_API_KEY');

        if ($configured && $this->option('api')) {
            try {
                $orders = $payments->orders();
                $this->record('API de pagos', true, count($orders).' órdenes recibidas');
            } catch (Throwable $exception) {
                report($exception);
                $this->record('API de pagos', false, 'Consulta fallida; revisa storage/logs');
            }
        }
    }

    private function record(string $check, bool $passed, string $detail): void
    {
        $this->results[] = [$check, $passed ? 'OK' : 'FALLO', $detail];
    }
}
