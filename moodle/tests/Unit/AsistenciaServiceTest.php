<?php

namespace Tests\Unit;

use App\Services\AsistenciaService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Tests\TestCase;

class AsistenciaServiceTest extends TestCase
{
    private AsistenciaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('asistencia.ip_key', 'clave-exclusiva-para-pruebas');
        config()->set('asistencia.red_empresa', '192.168.100');
        $this->service = app(AsistenciaService::class);
    }

    public function test_ip_encryption_round_trip_does_not_store_plaintext(): void
    {
        $encrypted = $this->service->encryptIp('192.168.100.25');

        $this->assertNotSame('192.168.100.25', $encrypted);
        $this->assertSame('192.168.100.25', $this->service->decryptIp($encrypted));
        $this->assertNull($this->service->decryptIp('contenido-invalido'));
    }

    public function test_company_network_uses_the_configured_prefix(): void
    {
        $inside = Request::create('/', 'GET', [], [], [], ['REMOTE_ADDR' => '192.168.100.87']);
        $outside = Request::create('/', 'GET', [], [], [], ['REMOTE_ADDR' => '10.0.0.8']);

        $this->assertTrue($this->service->isOnCompanyNetwork($inside));
        $this->assertFalse($this->service->isOnCompanyNetwork($outside));
    }

    public function test_late_arrival_is_calculated_in_minutes(): void
    {
        $schedule = (object) [
            'hora_entrada' => '08:00:00',
            'hora_regreso_almuerzo' => '14:00:00',
        ];

        $this->assertSame(
            7,
            $this->service->calcularAtrasoMinutos(
                'LLEGADA',
                $schedule,
                Carbon::parse('2026-09-01 08:07:00'),
            ),
        );
        $this->assertSame(
            0,
            $this->service->calcularAtrasoMinutos(
                'SALIDA',
                $schedule,
                Carbon::parse('2026-09-01 16:30:00'),
            ),
        );
    }

    public function test_net_minutes_supports_continuous_and_split_days(): void
    {
        $continuous = collect([
            'LLEGADA' => (object) ['hora_confirmada' => '2026-09-01 08:00:00', 'hora_marcacion' => null],
            'SALIDA' => (object) ['hora_confirmada' => '2026-09-01 16:00:00', 'hora_marcacion' => null],
        ]);

        $split = collect([
            'LLEGADA' => (object) ['hora_confirmada' => '2026-09-01 08:00:00', 'hora_marcacion' => null],
            'SALIDA_ALMUERZO' => (object) ['hora_confirmada' => '2026-09-01 13:00:00', 'hora_marcacion' => null],
            'REGRESO_ALMUERZO' => (object) ['hora_confirmada' => '2026-09-01 14:00:00', 'hora_marcacion' => null],
            'SALIDA' => (object) ['hora_confirmada' => '2026-09-01 17:00:00', 'hora_marcacion' => null],
        ]);

        $this->assertSame(480, $this->service->calcularHorasNetas($continuous));
        $this->assertSame(480, $this->service->calcularHorasNetas($split));
        $this->assertNull($this->service->calcularHorasNetas(collect()));
    }
}
