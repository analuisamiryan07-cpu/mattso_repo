# Endurecimiento de seguridad — nube (2026-10-27)

Alcance: sitio web React (raíz), Aula Virtual React (`aula-virtual/`), API NestJS (`backend-matsso/`), CertiBot (`certibot/`), configuración de Vercel / Render / Azure, y la guía de nginx del servidor del backoffice.

## 1. Dependencias vulnerables (todas a 0 vulnerabilidades en `npm audit`)

| Proyecto | Antes | Después |
|---|---|---|
| backend-matsso | 21 vulnerabilidades (2 críticas: `proxy-addr`, `tar`; 7 altas: `axios`, `multer`, `body-parser`, `bcrypt`…) | 0 |
| sitio web | 13 (6 altas: `axios`, `vite`, `follow-redirects`…) | 0 |
| aula-virtual | 7 (3 altas) | 0 |

Cambios de versión importantes:
- NestJS 10 (sin soporte) → **NestJS 11** (rama mantenida). Usa Express 5. Requiere Node ≥ 20.
- `bcrypt` 5 → 6, `googleapis` 144 → 188, `axios` → 1.21, `multer` → 2.5.
- Frontends: `react-router-dom` 6 → **7.18**, `vite` 5 → **6.4.5**, `axios` → 1.21.

## 2. API NestJS

**Autenticación**
- JWT con algoritmo fijo HS256 (bloquea confusión de algoritmo / `alg: none`).
- En cada petición se revisa la cuenta en la BD: cuenta desactivada o profesor degradado pierde acceso al instante (antes: hasta 2 h).
- Al cambiar la contraseña se invalidan todos los tokens anteriores (huella `pv` en el JWT).
- Token de recuperación: se guarda **hasheado** (SHA‑256), dura 30 min, es de un solo uso y el cambio exige la misma política de contraseña que el registro.
- Login con tiempo de respuesta constante (no permite averiguar qué correos existen).
- bcrypt con 12 rondas (antes 10).
- **Registro con cédula ajena**: antes cualquiera que conociera una cédula podía registrarse con ella, quedar vinculado al cliente existente (y ver sus datos) y cambiarle el correo. Ahora solo se vincula si el cliente no tiene cuenta web y el correo coincide; si no, 409.

**Claves de servidor a servidor**
- `x-admin-key`, `x-lms-m2m-key` y la clave de CertiBot se comparan en tiempo constante (antes `!==`). `AdminKeyGuard` reemplaza los `checkAdminKey()` duplicados.
- `/api/auth/admin/users` ya no está excluido del límite de peticiones.

**Límites de peticiones (rate limit)**
- Se corrigió un fallo: los `@Throttle({ default: … })` y `@SkipThrottle()` no tenían efecto porque el limitador se llama `global`.
- `trust proxy` activado (Render): antes todos los usuarios compartían la IP del proxy.
- Límites nuevos: chat 20/min, contacto 5/min, verificación QR 30/min, canje de clave 10/min, órdenes 5/min, entregas 10/min, búsqueda de certificados 10/min.

**Datos y archivos**
- `/uploads` ya no se publica (exponía comprobantes de pago con datos personales).
- Entregas de tareas: se verifica el contenido real del archivo (PDF/DOCX/JPG/PNG), no solo el tipo que declara el navegador.
- Correos: todos los datos del usuario se escapan antes de insertarse en el HTML (antes se podía inyectar HTML/enlaces falsos en correos oficiales usando el nombre).
- Participantes de un curso: ya no se muestran los correos de los demás estudiantes.
- Errores de Google Drive y de base de datos ya no se devuelven al cliente; IDs mal formados devuelven 400/404 en lugar de 500.
- Límites de tamaño en todos los formularios (DTO) y cuerpo JSON máx. 256 KB.
- `cloudinary_url` de videos: solo `https://res.cloudinary.com/...`. `imagen_url` de productos: número o URL https.
- Respuestas del chatbot: solo se reenvían enlaces `http(s)` o rutas internas.

**Pagos y aula (condiciones de carrera)**
- Aprobación de orden, captura de PayPal y webhook de PayPal: la transición a `PAGADA` es atómica (no se duplican inscripciones ni correos).
- Webhook de PayPal: se valida monto y moneda contra lo registrado.
- `paypalOrderId` validado antes de usarlo en la URL de PayPal; mensajes de error ya no filtran IDs internos.
- Cuestionarios: envío atómico (3 envíos simultáneos → 1 calificado), tiempo límite verificado en el servidor, y se revisa que el acceso al curso siga vigente.

**Arranque**
- El servidor no arranca si falta `JWT_SECRET`/`DATABASE_URL` o si algún secreto conserva un valor de ejemplo; advierte en el log si los secretos son cortos o repetidos.
- Cabeceras: CSP `default-src 'none'`, HSTS con preload, `Cache-Control: no-store`, CORS sin cookies y sin error 500 ante orígenes no permitidos.
- Docker: `npm ci`, actualizaciones de Alpine, ejecución como usuario sin privilegios (`node`) y `HEALTHCHECK`.

## 3. Frontends (Vercel)

- `vercel.json` de ambos proyectos con: Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP. El Aula Virtual además `noindex`.
- `staticwebapp.config.json` (Azure) alineado con las mismas cabeceras.
- Chatbot: enlaces filtrados también en el navegador.
- Datos corruptos en `localStorage` ya no rompen la aplicación.

## 4. CertiBot

- Clave comparada con `hmac.compare_digest`.
- CORS desactivado por defecto (antes `*`); `/docs`, `/redoc` y `/openapi.json` deshabilitados.
- `docker-compose`: sistema de archivos de solo lectura, sin capacidades, `no-new-privileges`.

## 5. Nginx (servidor del backoffice)

En la nube no hay nginx (Vercel y Render lo gestionan). La guía de nginx del servidor Laravel (`docs/HANDOFF_SERVIDOR.md` y `docs/DESPLIEGUE.md` de `proyecto_matt_SERVIDOR/` y `moodle/`) ahora trae una configuración endurecida: HTTPS obligatorio, TLS 1.2/1.3, cabeceras de seguridad, `server_tokens off`, límites de tamaño y tiempo, rate limit del login, solo se ejecuta `index.php`, y se bloquean `.env`, `.git`, volcados `.sql/.dump` y respaldos.

## 6. Acciones manuales pendientes (no se pueden hacer desde el código)

1. **Render → variables de entorno**: confirmar que existen `ADMIN_API_KEY`, `ID_HASH_SECRET`, `LMS_*` y `FRONTEND_URL` (con `https://` y ambos dominios separados por coma). Opcional: `PUBLIC_SITE_URL`, `TRUST_PROXY_HOPS=1`. Rotar cualquier secreto de menos de 32 caracteres (`openssl rand -hex 32`); el log de arranque lo avisa.
2. **Probar el pago con PayPal en sandbox** tras desplegar el sitio: la nueva CSP permite los dominios de PayPal, pero hay que confirmarlo. Si algo falla, la consola del navegador indicará qué dominio falta en `vercel.json`.
3. **Archivo `fabled-tesla-503922-a8-52b88cef05d6.json`** (clave privada de cuenta de servicio de Google) está dentro de la carpeta del proyecto. Sacarlo de la carpeta y, si alguna vez se compartió (zip, repositorio, correo), rotar la clave en Google Cloud.
4. **Disco `uploads` de Render**: ya no se usa ni se publica. Revisar si tiene comprobantes antiguos, respaldarlos y eliminar el disco desde el dashboard.
5. Las sesiones abiertas se cerrarán una vez al desplegar (los tokens anteriores no tienen la huella `pv`); los enlaces de recuperación de contraseña pendientes dejarán de servir. Es esperado.
6. Pendiente de diseño (no incluido): mover el token de sesión de `localStorage` a una cookie `HttpOnly` requiere que la API y los frontends compartan dominio (p. ej. `api.sapper-industries.com`). Mientras tanto, la CSP reduce el riesgo.
