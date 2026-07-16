<?php

namespace Tests\Feature;

use App\Services\DocumentGenerationService;
use Illuminate\Support\Facades\File;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ReflectionClass;
use Tests\TestCase;

class C02GenerationTest extends TestCase
{
    public function test_c02_writes_all_fields_and_repeated_rows(): void
    {
        $directory = storage_path('framework/testing/c02-complete');
        File::deleteDirectory($directory);
        File::ensureDirectoryExists($directory);

        try {
            $service = app(DocumentGenerationService::class);
            $reflection = new ReflectionClass($service);
            $data = $reflection->getMethod('normalize')->invoke($service, $this->completeInput());
            $files = $reflection->getMethod('generateSelectedFiles')->invoke($service, ['c02'], $data, $directory);

            $spreadsheet = IOFactory::load($files[0]);
            $sheet = $spreadsheet->getSheet(0);

            $this->assertSame('15 de julio de 2026', $sheet->getCell('I8')->getValue());
            $this->assertSame('CUIDADO DE PERSONAS ADULTAS MAYORES', $sheet->getCell('A38')->getValue());
            $this->assertSame('X', $sheet->getCell('I38')->getValue());
            $this->assertNull($sheet->getCell('J38')->getValue());
            $this->assertSame('X', $sheet->getCell('K38')->getValue());
            $this->assertSame('ENTRENAMIENTO CANINO', $sheet->getCell('A39')->getValue());
            $this->assertSame('DEFENSA Y PROTECCIÓN', $sheet->getCell('C39')->getValue());
            $this->assertSame('X', $sheet->getCell('J39')->getValue());
            $this->assertSame('X', $sheet->getCell('L39')->getValue());

            foreach (['Escuela Uno', 'Colegio Dos', 'Curso 1', 'Curso 2', 'Curso 3', 'Curso 4', 'Empresa 1', 'Empresa 2', 'Empresa 3'] as $expected) {
                $this->assertTrue($this->sheetContains($sheet, $expected), "No se escribió {$expected} en C02.");
            }
            $this->assertTrue($this->sheetContains($sheet, '0123456789'));
            $this->assertTrue($this->sheetContains($sheet, '0987654321'));

            $residuals = [];
            foreach ($sheet->getCoordinates(false) as $coordinate) {
                $value = $sheet->getCell($coordinate)->getValue();
                if (is_string($value) && str_contains($value, 'SMD_')) {
                    $residuals[] = $coordinate;
                }
            }
            $this->assertSame([], $residuals);
            $spreadsheet->disconnectWorksheets();
        } finally {
            File::deleteDirectory($directory);
        }
    }

    private function sheetContains($sheet, string $expected): bool
    {
        foreach ($sheet->getCoordinates(false) as $coordinate) {
            if ($sheet->getCell($coordinate)->getValue() === $expected) {
                return true;
            }
        }

        return false;
    }

    private function completeInput(): array
    {
        return [
            'secuencia_codigo' => '001-2026',
            'nombre' => 'Persona de prueba',
            'cedula' => '1712345678',
            'telefono' => '022345678',
            'celular' => '0987654321',
            'correo' => 'persona@example.test',
            'edad' => 35,
            'direccion' => 'Av. de prueba',
            'fecha' => '2026-07-14',
            'fecha_c02' => '2026-07-15',
            'provincia' => 'Pichincha',
            'ciudad' => 'Quito',
            'lugar' => 'Sede Quito',
            'tipo_examen' => 'TEÓRICA Y PRÁCTICA',
            'puntaje_teorico' => '95',
            'puntaje_practico' => '90',
            'aplicaciones' => [
                ['perfil' => 'Cuidado de Personas Adultas Mayores', 'esquema' => 'Cuidado de Personas Adultas Mayores', 'unidades' => [1, 3, 5]],
                ['perfil' => 'Entrenamiento Canino', 'esquema' => 'Defensa y Protección', 'unidades' => [2, 4]],
            ],
            'instalaciones' => 'Centro de evaluación',
            'direccion_instalacion' => 'Calle principal',
            'sector_instalacion' => 'Norte',
            'telefono_instalacion' => '0123456789',
            'educaciones' => [
                'primaria' => ['seleccionado' => true, 'institucion' => 'Escuela Uno', 'pais' => 'Ecuador', 'ciudad' => 'Quito', 'titulo' => 'Primaria'],
                'secundaria' => ['seleccionado' => true, 'institucion' => 'Colegio Dos', 'pais' => 'Ecuador', 'ciudad' => 'Quito', 'titulo' => 'Bachiller'],
            ],
            'capacitaciones' => collect(range(1, 4))->map(fn (int $number): array => [
                'curso' => "Curso {$number}",
                'institucion' => "Institución {$number}",
                'fecha' => "2026-0{$number}-10",
                'horas' => 20 + $number,
            ])->all(),
            'experiencias' => collect(range(1, 3))->map(fn (int $number): array => [
                'fecha_desde' => "202{$number}-01-01",
                'fecha_hasta' => "202{$number}-12-31",
                'empresa' => "Empresa {$number}",
                'ciudad' => 'Quito',
                'telefono' => '099999999'.$number,
                'funcion' => "Función {$number}",
            ])->all(),
        ];
    }
}
