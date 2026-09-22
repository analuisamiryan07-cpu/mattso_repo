<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QrCertApiService
{
    private string $baseUrl;
    private string $adminKey;

    public function __construct()
    {
        $this->baseUrl  = rtrim((string) config('matsso.backend_url', 'https://tikky-hg4n.onrender.com'), '/');
        $this->adminKey = (string) config('matsso.admin_api_key', '');
    }

    private function client()
    {
        return Http::withHeaders(['x-admin-key' => $this->adminKey])
                   ->timeout(60);
    }

    public function getAll(): array
    {
        $response = $this->client()->get("{$this->baseUrl}/api/qr-certs/admin");
        if ($response->failed()) {
            Log::error('QrCertApi::getAll — ' . $response->status() . ' — ' . $response->body());
            throw new \RuntimeException('Error al conectar con el servidor: ' . $response->status());
        }
        return $response->json() ?? [];
    }

    public function create(array $data): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/qr-certs/admin", $data);
        if ($response->failed()) {
            Log::error('QrCertApi::create — ' . $response->body());
            throw new \RuntimeException('No se pudo crear el certificado QR.');
        }
        return $response->json() ?? [];
    }

    public function delete(int $id): void
    {
        $response = $this->client()->delete("{$this->baseUrl}/api/qr-certs/admin/{$id}");
        if ($response->failed()) {
            Log::error('QrCertApi::delete — ' . $response->body());
            throw new \RuntimeException('No se pudo eliminar el certificado QR.');
        }
    }
}
