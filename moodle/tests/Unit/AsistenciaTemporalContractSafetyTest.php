<?php

namespace Tests\Unit;

use App\Models\Horario;
use App\Models\RegistroAsistencia;
use App\Services\AsistenciaService;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Pruebas de regresión temporal y seguridad de contrato para Gestión de Horas.
 * 
 * Valida que los cálculos de tiempo, la ventana de 10 minutos ("verificando..."),
 * el formateo de marcaciones con offset +00 y la lógica de atrasos y horas netas
 * se mantengan consistentes con la representación de datos en PostgreSQL.
 */
class AsistenciaTemporalContractSafetyTest extends TestCase
{
    private AsistenciaService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AsistenciaService::class);
    }

    public function test_ahora_guayaquil_matches_local_ecuador_digits(): void
    {
        $nowEcuador = Carbon::now('America/Guayaquil');
        $ahoraService = $this->service->ahoraGuayaquil();

        $this->assertSame($nowEcuador->format('Y-m-d H:i'), $ahoraService->format('Y-m-d H:i'));
    }

    public function test_format_marcacion_10_minute_verification_window(): void
    {
        // Simulamos una marcación reciente (hace 2 minutos en hora Guayaquil)
        $hace2MinGuayaquil = Carbon::now('America/Guayaquil')->subMinutes(2);
        
        // Al hidratarse desde PostgreSQL TIMESTAMPTZ, llega como string local o Carbon +00
        $marcacionReciente = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $hace2MinGuayaquil->format('Y-m-d H:i:s'),
            '+00:00'
        );

        // Re-etiquetado idéntico al implementado en AsistenciaApiController y vistas
        $marcacionStr = $marcacionReciente->format('Y-m-d H:i:s');
        $marcacionTz  = Carbon::createFromFormat('Y-m-d H:i:s', $marcacionStr, 'America/Guayaquil');
        $confirmadoReciente = (int) $marcacionTz->diffInMinutes(Carbon::now('America/Guayaquil')) >= 10;

        // Hace 2 minutos: debe estar en ventana "verificando..." (confirmado = false)
        $this->assertFalse($confirmadoReciente);

        // Simulamos una marcación de hace 15 minutos
        $hace15MinGuayaquil = Carbon::now('America/Guayaquil')->subMinutes(15);
        $marcacionAntigua = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $hace15MinGuayaquil->format('Y-m-d H:i:s'),
            '+00:00'
        );

        $marcacionAntiguaStr = $marcacionAntigua->format('Y-m-d H:i:s');
        $marcacionAntiguaTz  = Carbon::createFromFormat('Y-m-d H:i:s', $marcacionAntiguaStr, 'America/Guayaquil');
        $confirmadoAntiguo   = (int) $marcacionAntiguaTz->diffInMinutes(Carbon::now('America/Guayaquil')) >= 10;

        // Hace 15 minutos: debe estar confirmada (confirmado = true)
        $this->assertTrue($confirmadoAntiguo);
    }

    public function test_raw_utc_diff_would_cause_300_minute_error_without_retagging(): void
    {
        // Si comparamos directamente un Carbon con offset +00 contra now('America/Guayaquil'),
        // PHP convierte internamente a UTC y genera ~300 minutos (5h) de diferencia errónea.
        $nowGye = Carbon::now('America/Guayaquil');
        $carbonUtcStored = Carbon::createFromFormat('Y-m-d H:i:s', $nowGye->format('Y-m-d H:i:s'), '+00:00');

        // La diferencia directa entre el objeto +00 y now(Guayaquil) es de aprox. 300 minutos
        $diffErroneo = (int) round($carbonUtcStored->diffInMinutes($nowGye));
        $this->assertGreaterThanOrEqual(299, $diffErroneo);

        // Con el re-etiquetado correcto, la diferencia en minutos enteros es 0
        $retagged = Carbon::createFromFormat('Y-m-d H:i:s', $carbonUtcStored->format('Y-m-d H:i:s'), 'America/Guayaquil');
        $diffCorrecto = (int) round($retagged->diffInMinutes($nowGye));
        $this->assertSame(0, $diffCorrecto);
    }

    public function test_arithmetic_late_calculation_avoids_timezone_shifts(): void
    {
        $schedule = (object) [
            'hora_entrada'          => '08:00:00',
            'hora_regreso_almuerzo' => '14:00:00',
        ];

        // 08:23:15 -> 23 minutos de tardanza
        $horaLlegada = Carbon::parse('2026-09-03 08:23:15');
        $atrasoLlegada = $this->service->calcularAtrasoMinutos('LLEGADA', $schedule, $horaLlegada);
        $this->assertSame(23, $atrasoLlegada);

        // Aritmética pura extraída en vistas / controladores
        $marcMin = $horaLlegada->hour * 60 + $horaLlegada->minute;
        [$eH, $eM] = array_map('intval', explode(':', substr($schedule->hora_entrada, 0, 5)));
        $atrasoAritmetico = max(0, $marcMin - ($eH * 60 + $eM));
        $this->assertSame(23, $atrasoAritmetico);
    }

    public function test_net_hours_with_homogeneous_utc_timestamps(): void
    {
        // Ambas marcas almacenadas con dígitos locales bajo la misma etiqueta +00
        $records = collect([
            'LLEGADA'          => (object) ['hora_confirmada' => '2026-09-03 08:00:00', 'hora_marcacion' => '2026-09-03 08:00:00'],
            'SALIDA_ALMUERZO'  => (object) ['hora_confirmada' => '2026-09-03 13:00:00', 'hora_marcacion' => '2026-09-03 13:00:00'],
            'REGRESO_ALMUERZO' => (object) ['hora_confirmada' => '2026-09-03 14:00:00', 'hora_marcacion' => '2026-09-03 14:00:00'],
            'SALIDA'           => (object) ['hora_confirmada' => '2026-09-03 17:00:00', 'hora_marcacion' => '2026-09-03 17:00:00'],
        ]);

        $minutos = $this->service->calcularHorasNetas($records);
        // (13:00 - 08:00 = 5h/300min) + (17:00 - 14:00 = 3h/180min) = 480 min (8 horas)
        $this->assertSame(480, $minutos);
    }

    public function test_asistencia_service_comments_do_not_contain_false_timestamp_type(): void
    {
        $serviceSource = file_get_contents(app_path('Services/AsistenciaService.php'));
        $this->assertStringNotContainsStringIgnoringCase(
            'TIMESTAMP without time zone',
            $serviceSource,
            'AsistenciaService comments must not refer to TIMESTAMP without time zone'
        );
        $this->assertStringContainsString(
            'TIMESTAMPTZ',
            $serviceSource,
            'AsistenciaService comments must accurately reference TIMESTAMPTZ'
        );
    }
}
