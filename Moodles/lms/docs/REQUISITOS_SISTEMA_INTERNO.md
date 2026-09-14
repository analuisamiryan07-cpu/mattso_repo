# Qué necesita el sistema interno (Laravel) para conectar con el Aula Virtual

Documento para el compañero que mantiene el sistema interno (`proyecto_matt` +
servidor Ubuntu). Nadie tocó ese sistema para armar esto — todo lo de abajo es
la lista de qué debe llamar Laravel, con qué credenciales, para que la nube
funcione con la lógica que se definió: **el administrador no existe en la
nube — todo lo administrativo (usuarios, permisos, profesores) vive
exclusivamente en el sistema interno.**

## 1. Regla general

Todo lo que hace el sistema interno hacia la nube pasa por la **API M2M**
(máquina-a-máquina) del backend NestJS, nunca por el login normal de un
usuario. Se autentica con un header fijo:

```
x-lms-m2m-key: <LMS_M2M_API_KEY>
x-lms-m2m-actor: nombre-de-quien-origina (texto libre, para logs)
```

`LMS_M2M_API_KEY` es una clave nueva, **distinta** de `ADMIN_API_KEY` (la que
ya usa el catálogo/órdenes). Hay que generarla (`openssl rand -hex 32`),
guardarla en las variables de entorno de Render (nube) y en la configuración
del sistema interno — nunca en el código de ningún lado.

## 2. Qué operaciones administrativas debe disparar el sistema interno

Esto es lo que en la nube **no existe ningún botón para hacer** — solo se
puede hacer llamando estos endpoints desde el sistema interno:

| Acción | Endpoint | Qué hace |
|---|---|---|
| Crear/editar un profesor | `POST /api/lms/admin/professors` | Crea (o promueve) un `UsuarioWeb` con `rol=PROFESOR`. Body: `{ correo, nombre, cliente_id? }`. Si el correo ya existe como estudiante, lo asciende a profesor — no crea una cuenta duplicada. |
| Desactivar/reactivar un profesor | `PATCH /api/lms/admin/professors/:usuarioId` | `{ activo: false }` — sin borrar el historial de cursos que ya dictó. |
| Crear/editar cualquier curso (override global) | `POST/PATCH /api/lms/admin/courses` (ya existe) | Uso principalmente para desactivar un curso a nivel institucional, aunque el profesor sea quien normalmente lo crea (ver §3). |
| Generar la clave de acceso al Aula Virtual | `POST /api/lms/admin/access-codes` | Body: `{ usuario_id }`. La nube genera un código de un solo uso, lo guarda, y **envía el correo por Brevo usando el `EmailService` que el backend ya tiene** (mismo proveedor que ya usan las órdenes/contacto — no hace falta que el sistema interno tenga su propia integración de Brevo). Devuelve `{ code, expires_at }` en la respuesta, por si el sistema interno también quiere mandarlo por WhatsApp aparte. |
| Revocar una clave sin usar | `DELETE /api/lms/admin/access-codes/:usuarioId` | Por si se generó por error o el estudiante pierde el acceso. |

Ver `Moodles/lms/docs/API_CONTRACT.md` para el resto de endpoints M2M que ya
existían (crear contenido, calificar entregas, etc. — esos no cambiaron).

## 3. Qué puede hacer un profesor sin pasar por el sistema interno

Una vez que el sistema interno lo creó (§2), el profesor **inicia sesión él
mismo en el Aula Virtual** con su correo/contraseña — igual que un
estudiante — y desde ahí, sin volver a pasar por Laravel:

- Crea sus propios cursos (`POST /api/lms/professor/courses`).
- Sube recursos/videos a sus cursos.
- Ve y califica las entregas de sus estudiantes.

Un profesor **no puede** crear otros usuarios, ascender a nadie a profesor,
ni tocar cursos que no son suyos — esas tres cosas están bloqueadas en el
código (no son una convención, el backend las rechaza) y solo las hace el
sistema interno vía §2.

## 4. La clave de acceso (segundo factor del Aula Virtual)

Flujo completo, de punta a punta:

1. El sistema interno decide que un estudiante ya puede entrar al Aula
   Virtual (p.ej. porque ya pagó, o porque un admin lo autorizó) y llama a
   `POST /api/lms/admin/access-codes` (§2).
2. La nube genera el código, lo guarda internamente y **manda el correo por
   Brevo ella misma** — no hace falta que el sistema interno reenvíe nada por
   correo.
3. Si además quieren mandarlo por WhatsApp, el sistema interno usa el `code`
   que la nube le devolvió en la respuesta del paso 1 y lo manda por su
   cuenta — eso es responsabilidad 100% del sistema interno, la nube no sabe
   de WhatsApp.
4. El estudiante inicia sesión en el Aula Virtual (correo + contraseña) y
   luego ingresa ese código en el segundo paso. La nube lo valida
   (`POST /api/lms/access-codes/verify`), lo marca usado, y ahí recién lo deja
   entrar a sus cursos.

**Nota de diseño abierta, a confirmar con el equipo:** hoy el código se
genera de a uno por estudiante (no por curso). Si en el futuro se necesita un
código distinto por cada curso al que se inscribe, hay que avisar antes de
que se generen códigos reales en producción — cambiar eso después implica
tocar la tabla que guarda los códigos.

## 5. Lo que la nube nunca va a aceptar desde el navegador de un estudiante

Para que quede explícito y no haya sorpresas de seguridad: `x-lms-m2m-key`
**nunca** se expone al frontend de React — ni el del sitio público ni el del
Aula Virtual. Si algún día el sistema interno necesita que el navegador del
estudiante dispare algo administrativo, la respuesta correcta es "no": ese
flujo tiene que pasar siempre por el sistema interno primero.
