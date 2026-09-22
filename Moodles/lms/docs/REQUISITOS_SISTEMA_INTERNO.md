# Qué necesita el sistema interno (Laravel) para conectar con el Aula Virtual

Documento para el compañero que mantiene el sistema interno (`proyecto_matt`
+ servidor Ubuntu). **Nadie tocó ese sistema para armar esto** — todo lo de
abajo es la lista completa de qué debe agregar/llamar Laravel para que la
nube funcione con la lógica que se definió: **el administrador no existe en
la nube — todo lo administrativo (usuarios, permisos, profesores) vive
exclusivamente en el sistema interno.**

Cada endpoint de este documento **ya existe, ya se probó compilando y
arrancando el backend real, y ya está desplegado en producción** (Render +
Vercel) — no es una propuesta a futuro. Este documento está escrito para que
se pueda seguir sin tener que preguntar nada más — si algo no queda claro,
es un error de este documento, avisar para corregirlo.

## 0. El flujo completo, de principio a fin, con un ejemplo real

Antes de los detalles técnicos, esto es lo que tiene que pasar, en orden,
para que un estudiante real entre a un curso real. **Si falta cualquiera de
estos pasos, los siguientes no funcionan** — no hay atajos.

1. **El sistema interno crea al profesor** (§2.1) — ej. `docente@sapper-industries.com`.
2. **El profesor inicia sesión en el Aula Virtual** (`https://aula.sapper-industries.com`)
   con su correo y la contraseña que definió (le llegó un correo para
   definirla apenas se creó su cuenta en el paso 1).
3. **El profesor crea un curso** desde el Aula Virtual, y lo liga a un
   producto real del catálogo (ej. "Prevención de Trabajos en Alturas",
   `producto_id = 108`). Sin este paso, comprar ese producto no inscribe a
   nadie en nada — la inscripción automática (paso 5) revisa si el producto
   tiene un curso vinculado, y si no lo tiene, simplemente no hace nada (no
   es un error, queda registrado en los logs como `no_course_linked`).
4. **Un cliente compra ese producto** en el sitio público (transferencia o
   PayPal) y el pago se aprueba (a mano en el caso de transferencia, o
   automático con PayPal).
5. **La nube inscribe automáticamente al comprador** en el curso del paso 3
   — esto ya está conectado, no requiere ninguna acción del sistema interno.
   Ocurre en el mismo instante en que la orden pasa a `PAGADA`.
6. **El sistema interno genera la clave de acceso** para ese comprador
   (§2.3) — puede ser inmediatamente después del paso 4, o cuando el negocio
   decida que corresponde (ej. después de confirmar el pago a mano).
7. **El estudiante entra al Aula Virtual**: inicia sesión → el sistema ya
   valida solo que tiene una orden pagada → le pide la clave del paso 6 →
   entra y ve el curso del paso 3 en "Mis cursos".

**Para probar esto de punta a punta sin esperar a tener la integración de
Laravel terminada**, se puede hacer manual con Postman/curl usando
`LMS_M2M_API_KEY` para los pasos 1 y 6 — ver §5.

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
nuevos — no se reutiliza `ADMIN_API_KEY` (ver §3).

### 1.1 Agregar a `config/matsso.php`

```php
'lms_m2m_api_key' => env('LMS_M2M_API_KEY'),
```

### 1.2 Agregar a `.env` (y a `.env.example`, sin el valor real)

```
LMS_M2M_API_KEY=
```

El valor real **ya está generado y configurado en Render** — pídeselo
directamente a quien administra ese panel (no se repite aquí por seguridad).
**Tiene que ser exactamente el mismo valor en los dos lados** — un solo
carácter distinto y toda la API M2M responde `401 Unauthorized`.

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
            Log::error('LmsApi::crearOAscenderProfesor — ' . $response->status() . ' — ' . $response->body());
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
            Log::error('LmsApi::desactivarProfesor — ' . $response->status() . ' — ' . $response->body());
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
            Log::error('LmsApi::generarClaveAcceso — ' . $response->status() . ' — ' . $response->body());
            throw new \RuntimeException('No se pudo generar la clave de acceso.');
        }
        return $response->json() ?? []; // { usuario_id, code, expires_at }
    }

    public function revocarClaveAcceso(int $usuarioId): void
    {
        $response = $this->client()->delete("{$this->baseUrl}/api/lms/admin/access-codes/{$usuarioId}");
        if ($response->failed()) {
            Log::error('LmsApi::revocarClaveAcceso — ' . $response->status() . ' — ' . $response->body());
            throw new \RuntimeException('No se pudo revocar la clave.');
        }
    }
}
```

No hace falta registrar este service en ningún `ServiceProvider` — Laravel
lo resuelve solo por autowiring al pedirlo en el constructor de un
controller, igual que `CatalogApiService`.

## 2. Cada operación, con ejemplo de uso completo

Estos son los únicos 4 endpoints que necesita el sistema interno. Todos
llevan el mismo header `x-lms-m2m-key` (§1).

### 2.1 Crear o ascender un profesor

```
POST /api/lms/admin/professors
Body: { "correo": "docente@sapper-industries.com", "cliente_id": 45 }
```

- Si `docente@...` **ya existe** como `UsuarioWeb` (ej. ya compró algo antes
  como estudiante), lo asciende a `rol=PROFESOR`. Responde
  `{ id, correo, rol, creado: false }`.
- Si **no existe**, lo crea con una contraseña aleatoria que nadie conoce, y
  dispara automáticamente el correo de "recuperar contraseña" (el mismo que
  ya usa `/forgot-password` del sitio) para que el profesor defina la suya.
  Responde `{ id, correo, rol, creado: true }`.
- `cliente_id` es **opcional**. Es el `id` de una fila ya existente en
  `public.clientes`. Si no lo mandas, el profesor va a aparecer como
  "Profesor" genérico en vez de su nombre real, en todo el sistema (JWT,
  correos) — porque `Cliente.cedula` es obligatoria y única, y no hay una
  cédula real que inventarle si no viene de un registro existente. Si el
  profesor ya está en `clientes` (por ejemplo porque también es examinando
  certificado), pásalo — mejora la experiencia pero no es indispensable.
- Errores esperados: `409 Conflict` si el correo ya es profesor (no hace
  nada, no es un error grave, solo significa que ya estaba hecho).

Guarda el `id` que devuelve la respuesta — es el `usuario_id` que vas a usar
en §2.3.

### 2.2 Desactivar/reactivar un profesor

```
PATCH /api/lms/admin/professors/:usuarioId
Body: { "activo": false }
```

No borra sus cursos ni su historial, solo le bloquea el acceso.

### 2.3 Generar la clave de acceso al Aula Virtual

```
POST /api/lms/admin/access-codes
Body: { "usuario_id": 123 }
```

- `usuario_id` es el `id` de un `UsuarioWeb` (estudiante **o** profesor —
  ambos usan el mismo portón de entrada).
- La nube genera un código de 6 dígitos, lo guarda, y **manda el correo ella
  misma por Brevo** — no hace falta que el sistema interno tenga su propia
  integración de correo para esto.
- Responde `{ usuario_id, code, expires_at }`. Usa `code` si además quieres
  mandarlo por WhatsApp — eso es 100% responsabilidad del sistema interno,
  la nube no sabe de WhatsApp.
- El código es de un solo uso y **uno por estudiante**, no uno por curso —
  ver la nota abierta en §4.
- Si vuelves a llamar este endpoint para el mismo `usuario_id` antes de que
  use el código anterior, **el código viejo se invalida y se reemplaza por
  el nuevo** (no quedan dos códigos activos a la vez).

### 2.4 Revocar una clave sin usar

```
DELETE /api/lms/admin/access-codes/:usuarioId
```

Por si se generó por error o el estudiante reporta que no le llegó y hay que
anularla antes de generar otra.

## 3. Errores comunes y cómo diagnosticarlos

| Síntoma | Causa probable | Cómo confirmarlo |
|---|---|---|
| `401 Unauthorized` en cualquier llamada | `LMS_M2M_API_KEY` no coincide entre Laravel y Render, o falta el header | Revisar que `config('matsso.lms_m2m_api_key')` no esté vacío (`php artisan tinker` → `config('matsso.lms_m2m_api_key')`) |
| `404 Not Found` | Ruta mal escrita (falta `/api` al inicio, o el `usuario_id` no es numérico) | Comparar contra las rutas exactas de este documento, son sensibles a mayúsculas/minúsculas |
| `409 Conflict` al crear profesor | El correo ya tiene `rol=PROFESOR` | No es un error real — ya estaba hecho, seguir normal |
| El profesor no ve su nombre real, solo "Profesor" | No se mandó `cliente_id` en §2.1 | Volver a llamar `PATCH` no sirve para esto hoy — no hay endpoint para agregar `cliente_id` después de creado; avisar si hace falta uno |
| El estudiante compra pero "Mis cursos" le sale vacío | Ningún curso está vinculado al producto que compró (paso 3 del flujo de §0 nunca se hizo) | Confirmar con el profesor que creó el curso y que lo ligó al `producto_id` correcto |
| El correo de la clave nunca llega | Revisar que el `UsuarioWeb.correo` sea válido, o revisar el panel de Brevo por errores de envío | La respuesta de `POST /api/lms/admin/access-codes` de todas formas devuelve `code` — se puede entregar manualmente mientras se investiga |

## 4. Nota de diseño abierta

Hoy el código de acceso es **uno por estudiante**, no uno por curso — si en
el futuro se necesita un código distinto por cada curso al que se inscribe
alguien, avisar antes de generar códigos reales en producción con el diseño
actual — cambiarlo después implica una migración de la tabla que los guarda.

## 5. Cómo probar cada endpoint sin esperar a que la integración de Laravel esté lista

Con `curl` (reemplazar `TU_LMS_M2M_API_KEY` por el valor real de Render):

```bash
# Crear un profesor de prueba
curl -X POST https://tikky-hg4n.onrender.com/api/lms/admin/professors \
  -H "x-lms-m2m-key: TU_LMS_M2M_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"correo":"prueba.profesor@sapper-industries.com"}'

# Generar una clave de acceso para un usuario existente (usar el id real)
curl -X POST https://tikky-hg4n.onrender.com/api/lms/admin/access-codes \
  -H "x-lms-m2m-key: TU_LMS_M2M_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"usuario_id": 123}'
```

Esto sirve para armar y probar todo el flujo del §0 ahora mismo, sin
necesitar que `LmsApiService.php` esté terminado del lado de Laravel.

## 6. Qué puede hacer un profesor sin pasar por el sistema interno

Una vez creado (§2.1), el profesor **inicia sesión él mismo en el Aula
Virtual** con su correo/contraseña — igual que un estudiante — y desde ahí,
sin volver a pasar por Laravel:

- Crea sus propios cursos, módulos y contenido.
- Ve y califica solo las entregas de sus propios cursos.

Esto está verificado en el backend (`professor-courses.service.ts`), no es
una convención de interfaz: un profesor no puede crear otros usuarios,
ascender a nadie, ni tocar cursos que no son suyos aunque llame a la API
directamente — el backend lo rechaza.

## 7. Lo que la nube nunca va a aceptar desde el navegador de un estudiante

`x-lms-m2m-key` **nunca** se expone a ningún frontend de React (ni el sitio
público ni el Aula Virtual). Cualquier flujo que hoy o en el futuro necesite
que el navegador del estudiante dispare algo administrativo: la respuesta
correcta es que pase siempre por el sistema interno primero.
