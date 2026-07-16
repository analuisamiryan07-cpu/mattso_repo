<?php

namespace App\Services;

use App\Models\Client;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymentApiService
{
    private function client(): PendingRequest
    {
        $key = config('matsso.admin_api_key');
        throw_if(blank($key), RuntimeException::class, 'ADMIN_API_KEY no está configurada.');

        return Http::baseUrl(config('matsso.backend_url'))
            ->acceptJson()
            ->withHeader('x-admin-key', $key)
            ->connectTimeout(5)
            ->timeout(15)
            ->retry(2, 250, throw: false);
    }

    public function orders(): array
    {
        $response = $this->client()->get('/api/ordenes');
        throw_unless($response->successful(), RuntimeException::class, 'No fue posible consultar las órdenes.');

        return array_map(function (array $order): array {
            $proof = $order['comprobante_url'] ?? null;
            if (is_string($proof) && $proof !== '') {
                $url = str_starts_with($proof, 'http')
                    ? $proof
                    : config('matsso.backend_url').'/'.ltrim($proof, '/');
                $valid = filter_var($url, FILTER_VALIDATE_URL)
                    && parse_url($url, PHP_URL_HOST) === parse_url(config('matsso.backend_url'), PHP_URL_HOST);
                $order['comprobante_url_segura'] = $valid ? $url : null;
            }

            return $order;
        }, $response->json() ?? []);
    }

    public function updateStatus(int $orderId, string $status): void
    {
        $response = $this->client()->patch("/api/ordenes/{$orderId}/estado", ['estado' => $status]);
        throw_unless($response->successful(), RuntimeException::class, 'No fue posible actualizar la orden.');

        $client = $response->json('cliente');
        if ($status === 'PAGADA' && is_array($client) && filled($client['cedula'] ?? null)) {
            DB::transaction(function () use ($client): void {
                Client::query()->updateOrCreate(
                    ['cedula' => $client['cedula']],
                    [
                        'nombre' => $client['nombre'] ?? '',
                        'correo' => $client['correo'] ?? null,
                        'telefono' => $client['telefono'] ?? null,
                        'direccion' => $client['direccion'] ?? null,
                        'fecha' => now()->toDateString(),
                        'ciudad' => $client['ciudad'] ?? null,
                        'lugar' => $client['lugar'] ?? null,
                        'esquema' => $client['esquema'] ?? null,
                        'tipo_examen' => $client['tipo_examen'] ?? null,
                    ],
                );
            });
        }
    }
}
