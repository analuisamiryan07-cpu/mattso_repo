<?php

namespace Tests\Unit;

use Tests\TestCase;

class NotasAsistenciaFkSafetyTest extends TestCase
{
    public function test_fk_migration_does_not_attempt_alter_table(): void
    {
        $source = file_get_contents(database_path(
            'migrations/2026_09_01_040000_add_fk_notas_asistencia_empleado.php'
        ));

        $this->assertIsString($source);

        // The migration must NOT attempt to ALTER the table (owned by postgres)
        $this->assertDoesNotMatchRegularExpression('/ALTER\s+TABLE/i', $source);

        // It must validate the FK exists, not create it
        $this->assertStringContainsString('notas_asistencia_empleado_id_fkey', $source);
        $this->assertStringContainsString('pg_constraint', $source);

        // It must check for orphan rows
        $this->assertStringContainsString('orphan', strtolower($source));
    }

    public function test_fk_sql_is_idempotent_and_uses_cascade(): void
    {
        $ddl = file_get_contents(database_path(
            'sql/03_add_fk_notas_asistencia_empleado.sql'
        ));

        $this->assertIsString($ddl);

        // Must use IF NOT EXISTS pattern for idempotency
        $this->assertStringContainsString('IF NOT EXISTS', $ddl);

        // Must reference the correct constraint name
        $this->assertStringContainsString('notas_asistencia_empleado_id_fkey', $ddl);

        // Must use ON DELETE CASCADE
        $this->assertStringContainsString('ON DELETE CASCADE', $ddl);

        // Must reference the correct tables
        $this->assertStringContainsString('asistencia.notas_asistencia', $ddl);
        $this->assertStringContainsString('asistencia.empleados', $ddl);

        // Must guard against orphan rows
        $this->assertStringContainsString('orphan', strtolower($ddl));

        // Must be wrapped in a transaction
        $this->assertStringContainsString('BEGIN', $ddl);
        $this->assertStringContainsString('COMMIT', $ddl);
    }

    public function test_fk_migration_down_does_not_drop_anything(): void
    {
        $source = file_get_contents(database_path(
            'migrations/2026_09_01_040000_add_fk_notas_asistencia_empleado.php'
        ));

        // The down() method must not drop the FK or the table
        $this->assertDoesNotMatchRegularExpression('/DROP\s+CONSTRAINT/i', $source);
        $this->assertDoesNotMatchRegularExpression('/DROP\s+TABLE/i', $source);
    }
}
