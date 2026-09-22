<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymentApiService
{
    private const ALLOWED_COMPROBANTE_HOSTS = [
        'res.cloudinary.com',
        'res-1.cloudinary.com',
        'res-2.cloudinary.com',
        'res-3.cloudinary.com',
        'res-4.cloudinary.com',
    ];

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

    private function safeComprobanteUrl(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }

        if (
            str_starts_with($url, '/uploads/')
            && ! str_contains($url, '..')
            && preg_match('#^/uploads/[A-Za-z0-9/_\-.]+$#D', $url) === 1
        ) {
            return rtrim((string) config('matsso.backend_url'), '/').$url;
        }

        $parsed = filter_var($url, FILTER_VALIDATE_URL);
        if (! $parsed) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);
        if (! $host) {
            return null;
        }

        // Permite Cloudinary
        if (in_array($host, self::ALLOWED_COMPROBANTE_HOSTS, true)) {
            return $url;
        }

        // Permite el mismo host que el backend (para desarrollo local con /uploads)
        $backendHost = parse_url(config('matsso.backend_url'), PHP_URL_HOST);
        return $host === $backendHost ? $url : null;
    }

    public function orders(): array
    {
        $response = $this->client()->get('/api/ordenes');
        throw_unless($response->successful(), RuntimeException::class, 'No fue posible consultar las órdenes.');

        return array_map(function (array $order): array {
            $proof = $order['comprobante_url'] ?? null;
            $order['comprobante_url_segura'] = $this->safeComprobanteUrl($proof);

            return $order;
        }, $response->json() ?? []);
    }

    /**
     * Orden creada a mano (venta por teléfono) — nace ya en PAGADA. Mismo
     * x-admin-key que el resto de esta clase; el total lo calcula la nube a
     * partir del precio real del catálogo, nunca de lo que se manda aquí.
     */
    public function createOrder(int $usuarioId, array $items, float $montoPagadoManual): array
    {
        $response = $this->client()->post('/api/ordenes/admin', [
            'usuario_id' => $usuarioId,
            'items' => $items,
            'monto_pagado_manual' => $montoPagadoManual,
        ]);
        if ($response->failed()) {
            $msg = $response->json('message');
            throw new RuntimeException(is_string($msg) ? $msg : 'No fue posible crear la orden.');
        }

        return $response->json() ?? [];
    }

    public function updateStatus(int $orderId, string $status, ?string $motivo = null): void
    {
        $payload = ['estado' => $status];
        if ($status === 'RECHAZADA' && !blank($motivo)) {
            $payload['motivo'] = $motivo;
        }

        $response = $this->client()->patch("/api/ordenes/{$orderId}/estado", $payload);
        throw_unless($response->successful(), RuntimeException::class, 'No fue posible actualizar la orden.');
    }
}
