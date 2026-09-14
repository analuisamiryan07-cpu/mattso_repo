# Qué necesita el sistema interno (Laravel) para conectar con el Aula Virtual

Documento para el compañero que mantiene el sistema interno (`proyecto_matt`
+ servidor Ubuntu). **Nadie tocó ese sistema para armar esto** — todo lo de
abajo es la lista completa de qué debe agregar/llamar Laravel para que la
nube funcione con la lógica que se definió: **el administrador no existe en
la nube — todo lo administrativo (usuarios, permisos, profesores) vive
exclusivamente en el sistema interno.**

Cada endpoint de este documento **ya existe y ya se probó** (compilado y
arrancado de verdad, no solo escrito) en la rama `lms/aula-virtual` del
repositorio — no es una propuesta a futuro.

## 1. Patrón a seguir — el mismo que ya usa `proyecto_matt`

Laravel ya habla con el backend NestJS para catálogo/pagos/certificados QR
con un patrón fijo: un `*ApiService` por dominio, usando el facade `Http` con
un header de clave fija, y la config en `config/matsso.php` + `.env`. Ver
`app/Services/CatalogApiService.php` como referencia real:

```php
private function client()
{
    return Http::withHeaders(['x-admin-key' => $this->adminKey])->timeout(60);
}
```

Para el LMS se sigue exactamente el mismo patrón, con una clave y un service
nuevos — no se reutiliza `ADMIN_API_KEY` (ver §2).

### 1.1 Agregar a `config/matsso.php`

```php
'lms_m2m_api_key' => env('LMS_M2M_API_KEY'),
```

### 1.2 Agregar a `.env` (y a `.env.example`)

```
LMS_M2M_API_KEY=
```

Generar el valor real con `openssl rand -hex 32` — **debe ser idéntico** al
que se configure en Render como `LMS_M2M_API_KEY` (ver `Moodles/lms/docs/QUE_NECESITO_DE_TI.md`
para quién genera y dónde pega cada valor).

### 1.3 Nuevo `app/Services/LmsApiService.php` (esqueleto completo, copiar y ajustar)

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LmsApiService
{
    private string $baseUrl;
    private string $m2mKey;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('matsso.backend_url', 'https://tikky-hg4n.onrender.com'), '/');
        $this->m2mKey  = (string) config('matsso.lms_m2m_api_key', '');
    }

    private function client()
    {
        return Http::withHeaders([
            'x-lms-m2m-key'   => $this->m2mKey,
            'x-lms-m2m-actor' => 'proyecto_matt', // texto libre, queda en los logs de la nube
        ])->timeout(60);
    }

    public function crearOAscenderProfesor(string $correo, ?int $clienteId = null): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/lms/admin/professors", [
            'correo'     => $correo,
            'cliente_id' => $clienteId,
        ]);
        if ($response->failed()) {
            Log::error('LmsApi::crearOAscenderProfesor — ' . $response->body());
            throw new \RuntimeException('No se pudo crear/ascender al profesor.');
        }
        return $response->json() ?? [];
    }

    public function desactivarProfesor(int $usuarioId, bool $activo): array
    {
        $response = $this->client()->patch("{$this->baseUrl}/api/lms/admin/professors/{$usuarioId}", [
            'activo' => $activo,
        ]);
        if ($response->failed()) {
            Log::error('LmsApi::desactivarProfesor — ' . $response->body());
            throw new \RuntimeException('No se pudo cambiar el estado del profesor.');
        }
        return $response->json() ?? [];
    }

    public function generarClaveAcceso(int $usuarioId): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/lms/admin/access-codes", [
            'usuario_id' => $usuarioId,
        ]);
        if ($response->failed()) {
            Log::error('LmsApi::generarClaveAcceso — ' . $response->body());
            throw new \RuntimeException('No se pudo generar la clave de acceso.');
        }
        return $response->json() ?? []; // { usuario_id, code, expires_at }
    }

    public function revocarClaveAcceso(int $usuarioId): void
    {
        $response = $this->client()->delete("{$this->baseUrl}/api/lms/admin/access-codes/{$usuarioId}");
        if ($response->failed()) {
            Log::error('LmsApi::revocarClaveAcceso — ' . $response->body());
            throw new \RuntimeException('No se pudo revocar la clave.');
        }
    }
}
```

## 2. Operaciones que solo el sistema interno puede disparar

En la nube **no existe ningún botón para hacer esto** — solo estos endpoints:

| Acción | Endpoint | Body | Qué hace |
|---|---|---|---|
| Crear o ascender un profesor | `POST /api/lms/admin/professors` | `{ correo, cliente_id? }` | Si el correo ya es un `UsuarioWeb` (típicamente un estudiante que se vuelve instructor), lo asciende a `rol=PROFESOR`. Si no existe, crea la cuenta con una contraseña aleatoria que **nadie conoce** y dispara automáticamente el correo de "recuperar contraseña" (mismo flujo de `/forgot-password` que ya usa el sitio) para que el profesor defina la suya. `cliente_id` es opcional — sin él, su nombre no aparece en el sistema (sale "Profesor" genérico) porque `Cliente.cedula` es obligatoria y única y no hay una cédula real que inventarle; si el profesor ya está registrado como `Cliente` (p.ej. porque también es un examinando certificado), pásalo. |
| Desactivar/reactivar un profesor | `PATCH /api/lms/admin/professors/:usuarioId` | `{ activo: boolean }` | No borra su historial de cursos ya dictados, solo le quita acceso. |
| Generar la clave de acceso al Aula Virtual | `POST /api/lms/admin/access-codes` | `{ usuario_id }` | La nube genera un código de 6 dígitos, lo guarda y **manda el correo ella misma por Brevo** — el sistema interno no necesita su propia integración de correo para esto. Devuelve `{ usuario_id, code, expires_at }` — usa `code` si además quieres mandarlo por WhatsApp (eso es 100% responsabilidad del sistema interno, la nube no sabe de WhatsApp). |
| Revocar una clave sin usar | `DELETE /api/lms/admin/access-codes/:usuarioId` | — | Por si se generó por error o el estudiante pierde el acceso. |
| Crear/editar cualquier curso (override global) | `POST` / `PATCH /api/lms/admin/courses[/:courseId]` | Ver `API_CONTRACT.md` | Ya existía. Principalmente para desactivar un curso a nivel institucional — el profesor es quien normalmente crea/edita los suyos (§3). |

Todos usan el mismo header `x-lms-m2m-key` (§1). Ver `API_CONTRACT.md` para
el resto de endpoints M2M que no cambiaron (contenido, entregas pendientes,
calificación global).

## 3. Qué puede hacer un profesor sin pasar por el sistema interno

Una vez creado (§2), el profesor **inicia sesión él mismo en el Aula
Virtual** con su correo/contraseña — igual que un estudiante — y desde ahí,
sin volver a pasar por Laravel:

- Crea sus propios cursos, módulos y contenido.
- Ve y califica solo las entregas de sus propios cursos.

Esto está verificado en el backend (`professor-courses.service.ts`), no es
una convención de interfaz: un profesor no puede crear otros usuarios,
ascender a nadie, ni tocar cursos que no son suyos aunque llame a la API
directamente.

## 4. El flujo completo de la clave de acceso, de punta a punta

1. El sistema interno decide que un estudiante ya puede entrar (p.ej.
   confirmó el pago) y llama a `POST /api/lms/admin/access-codes` (§2).
2. La nube genera el código, lo guarda y manda el correo por Brevo.
3. Si además quieren mandarlo por WhatsApp, el sistema interno usa el `code`
   devuelto en el paso 1.
4. El estudiante entra al Aula Virtual, inicia sesión (correo + contraseña +
   validación automática de que tiene una orden pagada — ver
   `DECISIONES.md` §9), y en el segundo paso ingresa el código. La nube lo
   valida, lo marca usado, y ahí recién lo deja entrar a sus cursos.

**Nota abierta:** hoy el código es uno por estudiante, no uno por curso. Si
hace falta un código distinto por curso, avisar antes de generar códigos
reales — cambiarlo después implica tocar la tabla que los guarda.

## 5. Lo que la nube nunca va a aceptar desde el navegador de un estudiante

`x-lms-m2m-key` **nunca** se expone a ningún frontend de React (ni el sitio
público ni el Aula Virtual). Cualquier flujo que hoy o en el futuro necesite
que el navegador del estudiante dispare algo administrativo: la respuesta
correcta es que pase siempre por el sistema interno primero.
