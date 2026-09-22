<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const EXPECTED_COLUMNS = [
        'empleados' => [
            'id', 'usuario_id', 'nombres_completos', 'cedula', 'genero',
            'correo', 'celular', 'fecha_nacimiento', 'estado', 'ip_celular_enc',
            'ip_computadora_enc', 'creado_en', 'actualizado_en', 'grupo',
            'es_pasante', 'primer_apellido', 'segundo_apellido',
            'primer_nombre', 'segundo_nombre',
        ],
        'horarios' => [
            'id', 'empleado_id', 'hora_entrada', 'hora_salida_almuerzo',
            'hora_regreso_almuerzo', 'hora_salida', 'creado_en',
        ],
        'notas_asistencia' => [
            'id', 'empleado_id', 'fecha', 'nota', 'created_at', 'updated_at',
        ],
        'registros_asistencia' => [
            'id', 'empleado_id', 'tipo', 'hora_marcacion', 'hora_confirmada',
            'minutos_descontados', 'fecha', 'atraso_minutos',
        ],
        'tokens_movil' => [
            'id', 'empleado_id', 'token', 'dispositivo', 'creado_en', 'ultimo_uso',
        ],
    ];

    private const EXPECTED_CONSTRAINTS = [
        'empleados_cedula_key',
        'empleados_estado_check',
        'empleados_genero_check',
        'empleados_pkey',
        'empleados_usuario_id_fkey',
        'empleados_usuario_id_key',
        'horarios_empleado_id_fkey',
        'horarios_empleado_id_key',
        'horarios_pkey',
        'notas_asistencia_empleado_id_fecha_key',
        'notas_asistencia_pkey',
        'registros_asistencia_empleado_id_fecha_tipo_key',
        'registros_asistencia_empleado_id_fkey',
        'registros_asistencia_pkey',
        'registros_asistencia_tipo_check',
        'tokens_movil_empleado_id_fkey',
        'tokens_movil_pkey',
        'tokens_movil_token_key',
    ];

    private const EXPECTED_INDEXES = [
        'idx_ra_empleado_fecha',
        'idx_ra_fecha',
        'idx_ra_pendientes',
        'idx_tm_token',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        if (! Schema::hasTable('usuarios_admin')) {
            throw new RuntimeException(
                'Gestión de Horas requiere public.usuarios_admin antes de crear el esquema asistencia.'
            );
        }

        $this->ensureVendorRoleIsAllowed();

        $schemaExists = (bool) DB::scalar(
            "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'asistencia')"
        );

        if (! $schemaExists) {
            $this->createFreshSchema();
        }

        $this->verifyContract();
    }

    public function down(): void
    {
        // Línea base deliberadamente irreversible: un rollback automático no
        // debe borrar personal, horarios, tokens ni marcaciones productivas.
    }

    private function ensureVendorRoleIsAllowed(): void
    {
        $roleChecks = DB::select(<<<'SQL'
            SELECT conname, pg_get_constraintdef(oid) AS definition
            FROM pg_constraint
            WHERE conrelid = 'public.usuarios_admin'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%rol%'
            SQL);

        foreach ($roleChecks as $check) {
            $definition = strtoupper((string) $check->definition);
            if (str_contains($definition, 'ADMINISTRADOR')
                && str_contains($definition, 'SECRETARIA')
                && str_contains($definition, 'VENDEDOR')) {
                return;
            }
        }

        $invalidRoles = DB::table('usuarios_admin')
            ->whereNotIn('rol', ['ADMINISTRADOR', 'SECRETARIA', 'VENDEDOR'])
            ->count();

        if ($invalidRoles > 0) {
            throw new RuntimeException(
                "No se puede ajustar usuarios_admin_rol_check: existen {$invalidRoles} roles no reconocidos."
            );
        }

        foreach ($roleChecks as $check) {
            $constraint = str_replace('"', '""', (string) $check->conname);
            DB::statement("ALTER TABLE public.usuarios_admin DROP CONSTRAINT \"{$constraint}\"");
        }

        DB::statement(<<<'SQL'
            ALTER TABLE public.usuarios_admin
            ADD CONSTRAINT usuarios_admin_rol_check
            CHECK (rol IN ('ADMINISTRADOR', 'SECRETARIA', 'VENDEDOR'))
            SQL);
    }

    private function createFreshSchema(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE SCHEMA asistencia;

            CREATE TABLE asistencia.empleados (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL UNIQUE
                    REFERENCES public.usuarios_admin(id) ON DELETE CASCADE,
                nombres_completos TEXT NOT NULL,
                cedula VARCHAR(20) NOT NULL UNIQUE,
                genero CHAR(1) CHECK (genero IN ('M', 'F')),
                correo VARCHAR(150),
                celular VARCHAR(20),
                fecha_nacimiento DATE,
                estado VARCHAR(10) NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'inactivo')),
                ip_celular_enc TEXT,
                ip_computadora_enc TEXT,
                creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                grupo BOOLEAN NOT NULL DEFAULT TRUE,
                es_pasante BOOLEAN NOT NULL DEFAULT FALSE,
                primer_apellido VARCHAR(20),
                segundo_apellido VARCHAR(20),
                primer_nombre VARCHAR(20),
                segundo_nombre VARCHAR(20)
            );

            CREATE TABLE asistencia.horarios (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER NOT NULL UNIQUE
                    REFERENCES asistencia.empleados(id) ON DELETE CASCADE,
                hora_entrada TIME NOT NULL DEFAULT '08:00',
                hora_salida_almuerzo TIME NOT NULL DEFAULT '13:00',
                hora_regreso_almuerzo TIME NOT NULL DEFAULT '14:00',
                hora_salida TIME NOT NULL DEFAULT '17:00',
                creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE asistencia.notas_asistencia (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER NOT NULL,
                fecha DATE NOT NULL,
                nota TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT notas_asistencia_empleado_id_fecha_key
                    UNIQUE (empleado_id, fecha)
            );

            CREATE TABLE asistencia.registros_asistencia (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER NOT NULL
                    REFERENCES asistencia.empleados(id) ON DELETE CASCADE,
                tipo VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('LLEGADA', 'SALIDA_ALMUERZO', 'REGRESO_ALMUERZO', 'SALIDA')),
                hora_marcacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                hora_confirmada TIMESTAMPTZ,
                minutos_descontados INTEGER NOT NULL DEFAULT 0,
                fecha DATE NOT NULL,
                atraso_minutos INTEGER NOT NULL DEFAULT 0,
                CONSTRAINT registros_asistencia_empleado_id_fecha_tipo_key
                    UNIQUE (empleado_id, fecha, tipo)
            );

            CREATE TABLE asistencia.tokens_movil (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER NOT NULL
                    REFERENCES asistencia.empleados(id) ON DELETE CASCADE,
                token TEXT NOT NULL UNIQUE,
                dispositivo TEXT,
                creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ultimo_uso TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX idx_ra_empleado_fecha
                ON asistencia.registros_asistencia (empleado_id, fecha);
            CREATE INDEX idx_ra_fecha
                ON asistencia.registros_asistencia (fecha);
            CREATE INDEX idx_ra_pendientes
                ON asistencia.registros_asistencia (tipo, hora_confirmada)
                WHERE hora_confirmada IS NULL;
            CREATE INDEX idx_tm_token
                ON asistencia.tokens_movil (token);

            CREATE VIEW asistencia.v_comparacion_ips AS
            SELECT cedula, ip_computadora_enc, ip_celular_enc
            FROM asistencia.empleados;
            SQL);
    }

    private function verifyContract(): void
    {
        $columns = DB::table('information_schema.columns')
            ->select(['table_name', 'column_name'])
            ->where('table_schema', 'asistencia')
            ->whereIn('table_name', array_keys(self::EXPECTED_COLUMNS))
            ->get()
            ->groupBy('table_name')
            ->map(fn ($rows) => $rows->pluck('column_name')->all());

        $problems = [];
        foreach (self::EXPECTED_COLUMNS as $table => $expected) {
            $actual = $columns->get($table, []);
            $missing = array_values(array_diff($expected, $actual));
            if ($missing !== []) {
                $problems[] = "asistencia.{$table}: faltan columnas ".implode(', ', $missing);
            }
        }

        $constraints = DB::table('pg_constraint AS c')
            ->join('pg_namespace AS n', 'n.oid', '=', 'c.connamespace')
            ->where('n.nspname', 'asistencia')
            ->pluck('c.conname')
            ->all();
        $missingConstraints = array_values(array_diff(self::EXPECTED_CONSTRAINTS, $constraints));
        if ($missingConstraints !== []) {
            $problems[] = 'faltan restricciones: '.implode(', ', $missingConstraints);
        }

        $indexes = DB::table('pg_indexes')
            ->where('schemaname', 'asistencia')
            ->pluck('indexname')
            ->all();
        $missingIndexes = array_values(array_diff(self::EXPECTED_INDEXES, $indexes));
        if ($missingIndexes !== []) {
            $problems[] = 'faltan índices: '.implode(', ', $missingIndexes);
        }

        $viewExists = (bool) DB::scalar(<<<'SQL'
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.views
                WHERE table_schema = 'asistencia'
                  AND table_name = 'v_comparacion_ips'
            )
            SQL);
        if (! $viewExists) {
            $problems[] = 'falta la vista asistencia.v_comparacion_ips';
        }

        if ($problems !== []) {
            throw new RuntimeException(
                "El esquema asistencia existe pero no coincide con la línea base productiva:\n- ".
                implode("\n- ", $problems)
            );
        }
    }
};
