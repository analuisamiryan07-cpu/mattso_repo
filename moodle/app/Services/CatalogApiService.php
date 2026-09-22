<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CatalogApiService
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
        $response = $this->client()->get("{$this->baseUrl}/api/catalog/admin");
        if ($response->failed()) {
            Log::error('CatalogApi::getAll — HTTP ' . $response->status() . ' — ' . $response->body());
            throw new \RuntimeException('Error al conectar con el servidor: ' . $response->status());
        }
        return $response->json() ?? [];
    }

    public function create(array $data): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/catalog/admin", $data);
        if ($response->failed()) {
            Log::error('CatalogApi::create — ' . $response->body());
            throw new \RuntimeException('No se pudo crear el producto.');
        }
        return $response->json() ?? [];
    }

    public function update(int $id, array $data): array
    {
        $response = $this->client()->put("{$this->baseUrl}/api/catalog/admin/{$id}", $data);
        if ($response->failed()) {
            Log::error('CatalogApi::update — ' . $response->body());
            throw new \RuntimeException('No se pudo actualizar el producto.');
        }
        return $response->json() ?? [];
    }

    public function toggle(int $id): array
    {
        $response = $this->client()->patch("{$this->baseUrl}/api/catalog/admin/{$id}/toggle");
        if ($response->failed()) {
            Log::error('CatalogApi::toggle — ' . $response->body());
            throw new \RuntimeException('No se pudo cambiar el estado.');
        }
        return $response->json() ?? [];
    }

    public function getWebUsers(int $page = 1, string $search = ''): array
    {
        $params = ['page' => $page, 'limit' => 25];
        if ($search !== '') {
            $params['buscar'] = $search;
        }

        $response = $this->client()->get("{$this->baseUrl}/api/auth/admin/users", $params);
        if ($response->failed()) {
            Log::error('CatalogApi::getWebUsers — HTTP '.$response->status().' — '.$response->body());
            throw new \RuntimeException('Error al obtener usuarios web ('.$response->status().').');
        }

        return $response->json() ?? ['data' => [], 'meta' => []];
    }

    public function delete(int $id): void
    {
        $response = $this->client()->delete("{$this->baseUrl}/api/catalog/admin/{$id}");
        if ($response->failed()) {
            Log::error('CatalogApi::delete — ' . $response->body());
            throw new \RuntimeException('No se pudo eliminar el producto.');
        }
    }
}
