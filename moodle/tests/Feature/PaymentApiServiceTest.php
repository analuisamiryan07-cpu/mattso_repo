<?php

namespace Tests\Feature;

use App\Services\PaymentApiService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentApiServiceTest extends TestCase
{
    public function test_orders_are_read_through_the_external_api(): void
    {
        config(['matsso.backend_url' => 'https://backend.test', 'matsso.admin_api_key' => 'test-key']);
        Http::fake(['https://backend.test/api/ordenes' => Http::response([
            ['id' => 1, 'estado' => 'PENDIENTE', 'comprobante_url' => '/uploads/pago.jpg'],
            ['id' => 2, 'estado' => 'PENDIENTE', 'comprobante_url' => 'https://sitio-malicioso.test/pago.jpg'],
        ])]);

        $orders = app(PaymentApiService::class)->orders();

        $this->assertSame(1, $orders[0]['id']);
        $this->assertSame('https://backend.test/uploads/pago.jpg', $orders[0]['comprobante_url_segura']);
        $this->assertNull($orders[1]['comprobante_url_segura']);
        Http::assertSent(fn ($request) => $request->hasHeader('x-admin-key', 'test-key'));
    }

    public function test_approving_a_web_order_does_not_create_a_local_client(): void
    {
        config(['matsso.backend_url' => 'https://backend.test', 'matsso.admin_api_key' => 'test-key']);
        Http::fake([
            'https://backend.test/api/ordenes/42/estado' => Http::response([
                'id' => 42,
                'estado' => 'PAGADA',
                'cliente' => [
                    'cedula' => '1712345678',
                    'nombre' => 'Cliente web',
                ],
            ]),
        ]);

        app(PaymentApiService::class)->updateStatus(42, 'PAGADA');

        Http::assertSent(fn ($request) =>
            $request->method() === 'PATCH'
            && $request->url() === 'https://backend.test/api/ordenes/42/estado'
            && $request['estado'] === 'PAGADA'
        );
    }
}
