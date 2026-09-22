<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

// Mismo patrón que CatalogApiService/PaymentApiService, pero con su propia
// clave (LMS_M2M_API_KEY) — nunca ADMIN_API_KEY (ver
// Moodles/lms/docs/REQUISITOS_SISTEMA_INTERNO.md §1 y §3).
class LmsApiService
{
    private string $baseUrl;
    private string $m2mKey;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('matsso.backend_url', 'http://localhost:3000'), '/');
        $this->m2mKey  = (string) config('matsso.lms_m2m_api_key', '');
    }

    private function client(): PendingRequest
    {
        throw_if(blank($this->m2mKey), RuntimeException::class, 'LMS_M2M_API_KEY no está configurada.');

        // El actor queda en los logs de la nube (Course.created_by, etc. vía
        // AdminCoursesService) — texto libre, nunca un id que el navegador
        // pueda falsear, se arma con el usuario ya autenticado en Laravel.
        return Http::withHeaders([
            'x-lms-m2m-key'   => $this->m2mKey,
            'x-lms-m2m-actor' => 'laravel-admin:'.(auth()->id() ?? 'desconocido'),
        ])->acceptJson()->timeout(60);
    }

    // ── Cursos ──────────────────────────────────────────────────────────
    public function listCourses(): array
    {
        $r = $this->client()->get("{$this->baseUrl}/api/lms/admin/courses");
        throw_unless($r->successful(), RuntimeException::class, 'No fue posible consultar los cursos.');
        return $r->json() ?? [];
    }

    public function getCourse(string $courseId): array
    {
        $r = $this->client()->get("{$this->baseUrl}/api/lms/admin/courses/{$courseId}");
        throw_unless($r->successful(), RuntimeException::class, 'No fue posible consultar el curso.');
        return $r->json() ?? [];
    }

    public function createCourse(array $data): array
    {
        $r = $this->client()->post("{$this->baseUrl}/api/lms/admin/courses", $data);
        if ($r->failed()) {
            Log::error('LmsApi::createCourse — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo crear el curso.'));
        }
        return $r->json() ?? [];
    }

    public function updateCourse(string $courseId, array $data): array
    {
        $r = $this->client()->patch("{$this->baseUrl}/api/lms/admin/courses/{$courseId}", $data);
        if ($r->failed()) {
            Log::error('LmsApi::updateCourse — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo actualizar el curso.'));
        }
        return $r->json() ?? [];
    }

    public function createModule(string $courseId, array $data): array
    {
        $r = $this->client()->post("{$this->baseUrl}/api/lms/admin/courses/{$courseId}/modules", $data);
        if ($r->failed()) {
            Log::error('LmsApi::createModule — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo crear el módulo.'));
        }
        return $r->json() ?? [];
    }

    public function createContent(string $moduleId, array $data): array
    {
        $r = $this->client()->post("{$this->baseUrl}/api/lms/admin/modules/{$moduleId}/content", $data);
        if ($r->failed()) {
            Log::error('LmsApi::createContent — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo crear el contenido.'));
        }
        return $r->json() ?? [];
    }

    /** slot: hero|izquierda|derecha|moodle|coursera — ver course-cloudinary.util.ts del lado NestJS. */
    public function uploadCourseImage(string $courseId, string $slot, UploadedFile $file): array
    {
        $r = $this->client()
            ->attach('imagen', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
            ->post("{$this->baseUrl}/api/lms/admin/courses/{$courseId}/imagen", ['slot' => $slot]);
        if ($r->failed()) {
            Log::error('LmsApi::uploadCourseImage — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo subir la imagen.'));
        }
        return $r->json() ?? [];
    }

    // ── Claves de acceso (access grants) ───────────────────────────────
    public function listarClavesDisponibles(?string $correo, ?int $ordenId): array
    {
        $r = $this->client()->get("{$this->baseUrl}/api/lms/admin/access-grants/disponibles", array_filter([
            'correo' => $correo,
            'orden_id' => $ordenId,
        ]));
        throw_unless($r->successful(), RuntimeException::class, $this->mensajeError($r, 'No se pudieron consultar las compras.'));
        return $r->json() ?? [];
    }

    public function generarClave(int $ordenItemId): array
    {
        $r = $this->client()->post("{$this->baseUrl}/api/lms/admin/access-grants", ['orden_item_id' => $ordenItemId]);
        if ($r->failed()) {
            Log::error('LmsApi::generarClave — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo generar la clave.'));
        }
        return $r->json() ?? [];
    }

    public function revocarClave(int $ordenItemId): void
    {
        $r = $this->client()->delete("{$this->baseUrl}/api/lms/admin/access-grants/{$ordenItemId}");
        if ($r->failed()) {
            Log::error('LmsApi::revocarClave — '.$r->status().' — '.$r->body());
            throw new RuntimeException($this->mensajeError($r, 'No se pudo revocar la clave.'));
        }
    }

    private function mensajeError($response, string $fallback): string
    {
        $body = $response->json();
        $msg = $body['message'] ?? null;
        if (is_array($msg)) $msg = implode(' ', $msg);
        return is_string($msg) && $msg !== '' ? $msg : $fallback;
    }
}
