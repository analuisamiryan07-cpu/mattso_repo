<?php

namespace App\Support;

use JsonException;
use RuntimeException;

class CertificationCatalog
{
    private ?array $data = null;

    public function __construct(private readonly string $company = 'SAPPER')
    {
    }

    public function schemes(): array
    {
        return collect($this->data()['esquemas_certificacion'] ?? [])
            ->map(fn (array $item): array => [
                'profile' => $this->normalizeText((string) ($item['perfil_profesional'] ?? '')),
                'scheme' => $this->normalizeText((string) ($item['esquema_de_certificacion'] ?? '')),
            ])
            ->filter(fn (array $item): bool => $item['profile'] !== '' && $item['scheme'] !== '')
            ->values()
            ->all();
    }

    public function schemeNames(): array
    {
        return array_column($this->schemes(), 'scheme');
    }

    public function profileNames(): array
    {
        return collect($this->schemes())
            ->pluck('profile')
            ->unique()
            ->values()
            ->all();
    }

    public function profileFor(string $scheme): string
    {
        foreach ($this->schemes() as $item) {
            if ($item['scheme'] === $scheme) {
                return $item['profile'];
            }
        }

        return '';
    }

    public function examiners(): array
    {
        return collect($this->data()['examinadores'] ?? [])
            ->map(fn (array $item): array => [
                'id' => (string) ($item['no'] ?? ''),
                'name' => $this->normalizeText((string) ($item['nombres_y_apellidos'] ?? '')),
                'code' => $this->normalizeText((string) ($item['codigo'] ?? '')),
                'scheme' => $this->normalizeText((string) ($item['esquema_de_certificacion'] ?? '')),
                'cedula' => preg_replace('/\D+/', '', (string) ($item['cedula'] ?? '')),
                'phone' => preg_replace('/\D+/', '', (string) ($item['telefono'] ?? '')),
            ])
            ->filter(fn (array $item): bool => $item['id'] !== '' && $item['name'] !== '')
            ->values()
            ->all();
    }

    public function examinerIds(): array
    {
        return array_column($this->examiners(), 'id');
    }

    public function examiner(string|int|null $id): ?array
    {
        foreach ($this->examiners() as $examiner) {
            if ($examiner['id'] === (string) $id) {
                return $examiner;
            }
        }

        return null;
    }

    private function data(): array
    {
        if ($this->data !== null) {
            return $this->data;
        }

        $path = match ($this->company) {
            'MATSSO' => resource_path('document-templates/matsso/esquemas_y_examinadores_Matsso.js'),
            'FUMALU' => resource_path('document-templates/fumalu/esquemas_y_examinadores_Fumalu.js'),
            default => rtrim(config('matsso.template_path'), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'esquemas_y_examinadores_matsso.json',
        };
        if (! is_readable($path)) {
            throw new RuntimeException('No se encontró el catálogo de esquemas de certificación.');
        }

        try {
            $contents = file_get_contents($path);
            if (in_array($this->company, ['MATSSO', 'FUMALU'], true)) {
                preg_match('/=\s*(\{.*\})\s*;\s*(?:\/\/|if|export|$)/s', $contents, $match);
                $contents = $match[1] ?? '';
            }

            return $this->data = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('El catálogo de esquemas no contiene JSON válido.', previous: $exception);
        }
    }

    private function normalizeText(string $value): string
    {
        return preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
    }
}
