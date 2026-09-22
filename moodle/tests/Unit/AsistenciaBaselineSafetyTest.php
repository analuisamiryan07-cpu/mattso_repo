<?php

namespace Tests\Unit;

use Tests\TestCase;

class AsistenciaBaselineSafetyTest extends TestCase
{
    public function test_baseline_defines_the_productive_contract_without_drop_schema(): void
    {
        $source = file_get_contents(database_path(
            'migrations/2026_09_01_010000_baseline_asistencia_schema.php'
        ));

        $this->assertIsString($source);
        $this->assertDoesNotMatchRegularExpression('/DROP\s+SCHEMA/i', $source);
        $this->assertStringContainsString('Línea base deliberadamente irreversible', $source);

        foreach ([
            'empleados',
            'horarios',
            'notas_asistencia',
            'registros_asistencia',
            'tokens_movil',
        ] as $table) {
            $this->assertStringContainsString("CREATE TABLE asistencia.{$table}", $source);
        }
    }
}
