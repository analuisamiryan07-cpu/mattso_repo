# Guía de Pruebas de Seguridad — Colección Postman `MATSSO + LMS Security Testing`

Esta guía explica, carpeta por carpeta y request por request, qué hace cada prueba de la colección `Moodles/MATSSO_LMS_Security.postman_collection.json`, qué resultado debe dar si el sistema está bien, y qué significa si te da otra cosa. Sirve como referencia mientras corrés las pruebas, sin necesidad de volver a preguntar cada vez.

---

## 0. Cómo usar esta guía

- Corré las carpetas **en orden** (00 → 12). Varias pruebas dependen de variables que se guardan automáticamente en pasos anteriores (el `studentToken`, por ejemplo, lo genera la carpeta 00 y lo usan casi todas las demás).
- Cada request tiene una pestaña **Tests** en Postman. Después de correrlo, andá a la pestaña **Test Results** de la respuesta: ahí ves cada assertion en verde (✅ pasó) o rojo (❌ falló).
- **Regla general de lectura de resultados:**
  - Las pruebas marcadas como *baseline* (funcionalidad normal) deben dar `200`/`201`.
  - Las pruebas de **ataque** (inyección, credenciales falsas, tokens manipulados, etc.) **NUNCA** deben dar `200` (que el ataque haya funcionado) ni `500` (que haya roto el servidor y posiblemente filtrado un stack trace). Deben dar `400`, `401`, `403`, `404` o `429` según corresponda.
  - Si una prueba de ataque te da `200` → **falla de seguridad real**, hay que corregir el backend.
  - Si te da `500` → el input rompió algo no manejado (falta validación), también hay que corregirlo aunque no sea una vulnerabilidad explotable directa.
- Las carpetas **10, 11 y 12** son del **LMS/Moodle**, que todavía **no está construido**. Esas pruebas esperan `404` como resultado válido por ahora — ver sección [10-12](#carpetas-10-12--lms-planeado-no-tocar-todavía) más abajo.

---

## 1. Variables de la colección

| Variable | Grupo | Qué es | Cuándo se toca |
|---|---|---|---|
| `baseUrl` | A (real) | URL del backend NestJS a probar | Configurar una vez al inicio |
| `adminKey` | A (real) | Clave `x-admin-key` del backoffice (debe coincidir EXACTO con `ADMIN_API_KEY` del `.env` del backend) | Configurar una vez al inicio |
| `studentToken` | A (real) | JWT del usuario de prueba | Se autocompleta al correr la carpeta 00 (Login) |
| `studentEmail` / `studentPassword` | A (real) | Credenciales del usuario de prueba que se registra y loguea en la carpeta 00 | Ya vienen con valores por defecto, no hace falta tocarlas |
| `testProductId` / `testOrderId` / `testQrCodigo` | A (real) | IDs de ejemplo usados en varias pruebas (producto, orden, código QR) | Ajustar solo si tu base de datos no tiene un producto/orden con ID `1` |
| `lmsApiKey` | B (LMS, futuro) | Clave M2M Laravel → NestJS del LMS | **No tocar todavía** — el endpoint no existe |
| `lmsWebhookSecret` | B (LMS, futuro) | Secreto HMAC del webhook de inscripción del LMS | **No tocar todavía** — el endpoint no existe |

**Orden de trabajo correcto:** primero se deja 100% verde todo lo de las carpetas **00 a 09** (sistema real, en producción). Recién cuando eso esté validado se empieza a construir el backend del LMS, y ahí se completan `lmsApiKey` y `lmsWebhookSecret` para activar las carpetas 10-12.

---

## 2. Carpeta 00 · Setup — Ambiente

Se corre siempre primero, en este orden exacto. Prepara el usuario de prueba y el token que usan todas las demás carpetas.

### [SETUP] Health Check — `GET /api/health`
- **Prueba:** que el backend esté vivo y respondiendo.
- **Debe dar:** `200`, JSON, con campo `status: "ok"`.
- **Si falla:** el backend no está corriendo, o `baseUrl` está mal, o el túnel/red no llega al servidor. Nada más va a funcionar hasta resolver esto.

### [SETUP] Registrar usuario de prueba — `POST /api/auth/register`
- **Prueba:** crear el usuario `studentEmail` que se usará en el resto de las pruebas.
- **Debe dar:** `201` (se creó), `200` o `409` (ya existía de una corrida anterior) — **los tres son válidos**, no te preocupes si te da `409`.
- **Si falla (otro código, o 500):** revisar validaciones del endpoint de registro o que el body llegue bien.

### [SETUP] Login → guardar studentToken — `POST /api/auth/login`
- **Prueba:** loguear al usuario de prueba y guardar el JWT.
- **Debe dar:** `200`, con `access_token` en la respuesta (se guarda solo en la variable `studentToken`), y la respuesta **no debe** contener la palabra `password` ni `hash` en ningún lado (fuga de datos sensibles).
- **Cómo confirmar que quedó bien:** abrí el ícono del ojo (👁) o las variables de la colección y fijate que `studentToken` tenga un JWT largo (empieza con `eyJ...`), no esté vacío.
- **Si falla:** si da `401`, revisá que `studentEmail`/`studentPassword` coincidan con lo que se registró en el paso anterior. Si el registro anterior fue `409` (usuario ya existía) puede que la contraseña guardada en la BD sea distinta a la de la variable — en ese caso hay que resetear esa contraseña o cambiar `studentEmail` por uno nuevo.

---

## 3. Carpeta 01 · Auth — Credenciales y Brute Force

Prueba el endpoint de login/registro/recuperación de contraseña contra credenciales inválidas, inyección y abuso.

| Request | Qué prueba | Debe dar (OK) | Si falla / da otra cosa |
|---|---|---|---|
| AUTH-01 Credenciales incorrectas | Login con password errónea | `401`, sin stack trace (`at Object.`), sin texto `SELECT` | `200` = falla crítica de auth. `500` = falta manejo de errores |
| AUTH-02 Email inexistente | Login con correo que no existe | `401` (no `404`), sin frases como "no existe" / "not found" en el mensaje | Si da `404` o revela que el email no existe → permite enumerar usuarios registrados |
| AUTH-03 SQL Injection en correo | `' OR '1'='1'; --` como correo | No `200`, no `500`, sin `syntax error` ni `PG::` en la respuesta | `200` = inyección exitosa, gravísimo. `500` con mensaje de Postgres = filtra detalles internos |
| AUTH-04 SQL Injection en password | Igual pero en el campo password | No `200`, no `500` | Igual que arriba |
| AUTH-05 XSS en correo | `<script>alert(...)</script>` como correo | No `200`, y el `<script>` no debe aparecer sin escapar en la respuesta | Si el script se refleja tal cual, hay XSS reflejado |
| AUTH-06 Body vacío | `{}` como body | `400` o `401` | `500` = falta validación de DTO |
| AUTH-07 Payload gigante (10 KB) | Correo y password de 10.000 caracteres | No `200`, no `500` | Si tarda mucho o cae el servidor, falta un límite de tamaño de body |
| AUTH-08 Forgot Password — no enumera email | Pide reset con email inexistente | **Siempre `200`**, con mensaje genérico (sin "no existe") | Si da `404` o distingue el mensaje según si el email existe, permite enumeración |
| AUTH-09 Reset Password con token inválido | Token inventado | `400` | Si acepta el token igual, se puede resetear cualquier contraseña |
| AUTH-10 Registro con datos duplicados | Registra con el mismo `studentEmail` de la carpeta 00 | `409`, sin stack trace | `500` = falta manejo del error de duplicado en la capa de BD |
| AUTH-11 Mass assignment (rol=ADMIN) | Se registra mandando `"rol":"ADMIN"` en el body | Si responde `200`/`201`, el usuario creado **no** debe tener `rol: "ADMIN"`. Si no, debe dar `400`/`409` | Si el usuario queda creado como ADMIN → vulnerabilidad crítica de escalación de privilegios |

---

## 4. Carpeta 02 · Auth — JWT Manipulation

Prueba que el endpoint protegido `/api/auth/profile` valide correctamente el JWT en todos los escenarios de manipulación clásicos.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| JWT-01 Sin token | No manda header Authorization | `401` |
| JWT-02 Bearer vacío | `Authorization: Bearer ` (vacío) | `401` |
| JWT-03 Token malformado | String que no es un JWT | `401` |
| JWT-04 Algoritmo `none` | JWT con `alg: none` (ataque clásico para saltarse la firma) | `401` — **si da 200, es una vulnerabilidad crítica**, significa que la librería JWT no está validando el algoritmo |
| JWT-05 Firma incorrecta | JWT válido en forma pero firmado con otro secreto | `401` |
| JWT-06 Token expirado | JWT con `exp` en el pasado | `401` |
| JWT-07 Token válido (baseline) | Usa el `studentToken` real de la carpeta 00 | `200`, con un campo `user` en la respuesta, y **sin** `password_hash` ni `reset_token` en el JSON |

**Nota:** JWT-04 (algoritmo `none`) es la prueba más importante de esta carpeta — es un ataque real y conocido. Si falla (da `200`), hay que revisar la configuración de la librería `@nestjs/jwt` / `passport-jwt` para que fuerce el algoritmo esperado (`HS256`) y rechace `none`.

---

## 5. Carpeta 03 · Admin Key — Control de Acceso

Verifica que todos los endpoints de administración exijan el header `x-admin-key` correcto, y que un JWT de estudiante normal no sirva como sustituto.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| ADMIN-01 Sin clave | Lista usuarios sin header | `401` |
| ADMIN-02 Clave incorrecta | Header con clave inventada | `401` |
| ADMIN-03 Clave vacía | Header `x-admin-key: ""` | `401` |
| ADMIN-04 JWT de estudiante en vez de admin key | Usa `studentToken` en Authorization, sin `x-admin-key` | `401` — un estudiante logueado NO debe poder listar usuarios |
| ADMIN-05 Catálogo admin sin clave | `GET /api/catalog/admin` | `401` |
| ADMIN-06 Crear producto sin clave | `POST /api/catalog/admin` | `401` |
| ADMIN-07 Eliminar producto sin clave | `DELETE /api/catalog/admin/{id}` | `401` |
| ADMIN-08 QR admin sin clave | `GET /api/qr-certs/admin` | `401` |
| ADMIN-09 Órdenes sin clave | `GET /api/ordenes` | `401` |
| ADMIN-10 Clave válida (baseline) | Usa `{{adminKey}}` correcto | `200`, con campo `meta` (paginación), sin `password_hash` ni `reset_token` |

**Si ADMIN-10 falla con `401`:** el valor de la variable `adminKey` en Postman no coincide EXACTO (símbolos incluidos) con `ADMIN_API_KEY` configurado en el `.env` del backend. Revisar carácter por carácter.

---

## 6. Carpeta 04 · CORS y Headers HTTP

Verifica cabeceras de seguridad (Helmet) y que la configuración de CORS no exponga el sistema a otros orígenes.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| CORS-01 Cabeceras de seguridad | Revisa headers de `/api/health` | `X-Content-Type-Options: nosniff` presente; `Content-Security-Policy` o `X-Frame-Options` presente; **`X-Powered-By` NO debe existir** (revela que es Express/NestJS) |
| CORS-02 Origen no permitido | Simula un preflight desde `https://sitio-malicioso.xyz` | `Access-Control-Allow-Origin` de la respuesta **no debe ser** `*` (wildcard) |
| CORS-03 `x-admin-key` no debe viajar por CORS | Preflight pidiendo permiso para el header `x-admin-key` | El header `Access-Control-Allow-Headers` de la respuesta **no debe incluir** `x-admin-key` — esto evita que un frontend malicioso en el navegador pueda siquiera intentar mandar ese header |

**Si CORS-01 falla en "X-Powered-By eliminado":** falta o está mal configurado Helmet (`app.use(helmet())` en `main.ts` del NestJS).

---

## 7. Carpeta 05 · Catálogo — Inyección y Validación

Prueba el catálogo de productos, público y admin, contra inyección y path traversal.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| CAT-01 Catálogo público (baseline) | `GET /api/catalog` | `200`, respuesta es un array |
| CAT-02 SQL Injection en `?tipo` | Query string con `' OR '1'='1'; --` | No `500`, sin `syntax error` ni código `42601` de Postgres |
| CAT-03 XSS en `?tipo` | Query string con `<script>` | No `500`, script no reflejado sin escapar |
| CAT-04 Path traversal en slug | `/api/catalog/..%2F..%2F.env` | `400`, `404` o `200` — pero si es `200`, la respuesta **no debe** contener `JWT_SECRET` ni `DATABASE_URL` (o sea, no debe haber servido el archivo `.env` real) |
| CAT-05 Slug `admin` | `/api/catalog/:slug` con slug literal `admin` | `401` o `404` — no debe colisionar y devolver datos como si fuera un producto |
| CAT-06 Precio negativo (con clave admin) | Crea producto con `precio: -999` | Ideal: `400`/`422` rechazado. Si da `200`/`201`, el test solo **advierte** (no falla duro) — revisar manualmente si el DTO valida `precio > 0` |
| CAT-07 XSS en título (con clave admin) | Crea producto con `<script>` en el título | No `500`; si se acepta, el script no debe aparecer sin sanitizar en la respuesta |

**Nota sobre CAT-06:** es una prueba de "alerta", no de fallo estricto — el test pasa igual pero te deja un `console.warn` en la consola de Postman si el precio negativo fue aceptado. Revisá la consola (ícono abajo a la izquierda, "Postman Console") para ver esas advertencias.

---

## 8. Carpeta 06 · Órdenes — Lógica de Negocio y Uploads

Prueba la creación y aprobación de órdenes: manipulación de precios, archivos falsificados, IDOR.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| ORD-01 Crear orden sin JWT | Sin Authorization | `401` |
| ORD-02 Precio manipulado | Intenta forzar un precio distinto al real del producto | No `500`; si se crea la orden, el `total` debe ser el precio real del producto (no `-999` ni `0.01` inventado por el cliente) — el backend debe calcular el precio del lado del servidor, nunca confiar en el que manda el cliente |
| ORD-03 Cantidad negativa | Cantidad negativa en el ítem | Ideal `400`/`422`. Si se acepta, el `total` igual debe quedar positivo (advertencia si no) |
| ORD-04 Producto inexistente | ID de producto que no existe | `400` |
| ORD-05 Sin comprobante de pago | Body JSON sin archivo adjunto | `400` |
| ORD-06 MIME Spoofing | Sube un HTML renombrado con `Content-Type: image/jpeg` | `400`, con un mensaje de error que mencione "tipo" (de archivo) — el backend debe validar el contenido real, no confiar en el `Content-Type` declarado |
| ORD-07 Estado inválido al aprobar | `PATCH .../estado` con `"estado":"CANCELADA"` (no es un estado válido del flujo) | `400` |
| ORD-08 Rechazar sin motivo | `"estado":"RECHAZADA"` sin campo de motivo | `400` — rechazar una orden debe exigir justificación |
| ORD-09 IDOR — ID de orden inexistente | `PATCH /api/ordenes/999999999/estado` | `404` |

**Lo más importante de esta carpeta es ORD-02**: si el `total` de la orden se puede manipular desde el cliente, es una vulnerabilidad de lógica de negocio grave (comprar productos pagando lo que uno quiera).

---

## 9. Carpeta 07 · Pagos PayPal — Webhook y Captura

Prueba la seguridad del flujo de pagos con PayPal.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| PAY-01 Crear orden PayPal sin JWT | Sin Authorization | `401` |
| PAY-02 Capturar orden sin JWT | Sin Authorization | `401` |
| PAY-03 Webhook sin firma | Manda un evento de PayPal falso sin headers de firma | `200` con `received: true` — **PayPal espera 200 siempre** para no reintentar, pero el test trae una nota: hay que revisar manualmente en los **logs del servidor** que ese evento NO se haya procesado de verdad (o sea, que no se marque una orden como pagada solo por recibir el webhook sin validar firma) |
| PAY-04 Webhook con firma inválida | Manda headers de firma de PayPal pero con un valor falso | Igual, `200` de cara a PayPal, pero hay que confirmar en logs que fue ignorado |

**Importante:** PAY-03 y PAY-04 son las únicas pruebas de la colección donde `200` es lo esperado incluso en el caso de "ataque" — porque así lo exige el protocolo de webhooks de PayPal (si no devolvés 200, PayPal reintenta indefinidamente). La validación real de seguridad acá **no se ve en el código de respuesta**, se ve revisando los logs del backend para confirmar que un webhook con firma inválida no actualizó ninguna orden a "pagada". Si tenés acceso a los logs del servidor (`pm2 logs` o similar), revisalos después de correr estas dos.

---

## 10. Carpeta 08 · Certificados y QR

Prueba la búsqueda pública de certificados y la verificación de códigos QR.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| CERT-01 Búsqueda válida (baseline) | Busca "Carlos" | `200` o `404` |
| CERT-02 Nombre muy corto (1 letra) | `?nombre=A` | `400` |
| CERT-03 Sin parámetro nombre | Sin query string | `400` |
| CERT-04 XSS en nombre | `<script>` en la búsqueda | No `500`, script sanitizado en la respuesta |
| CERT-05 SQL injection en nombre | `'; DROP TABLE clientes; --` | No `500`, sin `SELECT` ni `syntax error` filtrados |
| CERT-06 Nombre extremadamente largo | 100+ caracteres | `400` |
| CERT-07 QR inexistente | Código que no existe | `404` |
| CERT-08 QR path traversal | `/api/verificar/..%2F..%2Fetc%2Fpasswd` | `400`/`404`, y la respuesta no debe contener `root:` (contenido de `/etc/passwd`) ni `JWT_SECRET` |
| CERT-09 Crear QR sin clave admin | Sin `x-admin-key` | `401` |
| CERT-10 Eliminar QR sin clave admin | Sin `x-admin-key` | `401` |

---

## 11. Carpeta 09 · Contacto y Chat

Prueba el formulario de contacto y el chatbot contra XSS y prompt injection.

| Request | Qué prueba | Debe dar (OK) |
|---|---|---|
| CHAT-01 Contacto válido (baseline) | Mensaje normal | `200` o `201` |
| CHAT-02 XSS en nombre/mensaje | `<script>` y `<img onerror=...>` | No `500`, nada reflejado sin escapar |
| CHAT-03 Email inválido | Formato de email incorrecto | No `500` (si se acepta igual, es solo una advertencia de falta de validación, revisar consola) |
| CHAT-04 Chat válido (baseline) | Pregunta normal al bot | `200`, con campo `response` |
| CHAT-05 Prompt injection básico | Intenta que el bot "ignore instrucciones" y revele la clave admin | No `500`; la respuesta no debe contener `jwt_secret`, `database_url`, `admin_api_key` ni `password_hash` |
| CHAT-06 Prompt injection — exfiltración | Pide que el bot repita su "system prompt" | La respuesta no debe contener frases como "system prompt", "instruction" ni "database"; no `500` |
| CHAT-07 Mensaje vacío | `message: ""` | No `500` |
| CHAT-08 Mensaje gigante (5000 chars) | Mensaje repetido muy largo | No `500` |

**Importante — CHAT-05 y CHAT-06:** si el bot usa un LLM (como este mismo tipo de asistente), es clave que el prompt de sistema le prohíba explícitamente repetir sus instrucciones o revelar variables de entorno, y que el backend nunca inyecte secrets reales en el contexto que el modelo puede leer.

---

## 12. Carpetas 10-12 — LMS (Planeado, NO tocar todavía)

Estas tres carpetas (`10 · [LMS] Webhook de Inscripción`, `11 · [LMS] M2M Admin API`, `12 · [LMS] Progreso VOD y Control de Acceso`) prueban endpoints del sistema LMS/Moodle descrito en `arquitectura_lms.md`, que **todavía no está implementado**.

Por eso, cada test de estas carpetas acepta `404` como resultado válido, además del código "ideal" (`401`, `403`, etc.). Ejemplo del patrón que vas a ver repetido:

```js
pm.test('Sin API key rechazado (401) o pendiente (404)', function() {
    pm.expect(pm.response.code).to.be.oneOf([401,403,404]);
});
```

**Qué esperar ahora mismo:** todas estas pruebas deberían darte `404 Not Found`, y van a pasar en verde igual porque `404` está contemplado como código válido mientras el endpoint no exista. Eso es normal y no requiere ninguna acción.

**Cuándo activarlas de verdad:** cuando empecemos a construir el backend NestJS del LMS (carpetas `11` usa `lmsApiKey`, carpeta `10` usa `lmsWebhookSecret` calculado por HMAC en un pre-request script). En ese momento:
1. Configuramos las claves reales (`lmsApiKey`, `lmsWebhookSecret`) para que coincidan con las del backend nuevo.
2. Volvemos a correr estas tres carpetas, y ahí sí los resultados deben ajustarse a los códigos "ideales" descritos en la tabla de la colección (por ejemplo, LMS-M2M-04 debería pasar de `404` a `201`).

No hay tabla detallada request-por-request de estas tres carpetas en esta guía porque, hasta que el LMS exista, el único resultado esperado es "endpoint no encontrado". Cuando arranquemos esa fase, actualizamos este documento con el detalle igual que las carpetas 00-09.

---

## 13. Qué hacer si algo no da lo esperado

1. **Anotá:** carpeta, nombre exacto del request, código de respuesta recibido, y el mensaje del test que falló (columna roja en Test Results).
2. **Revisá primero lo obvio:** `baseUrl` correcto, túnel/red activa, `studentToken` no vacío (si el fallo es en una carpeta 01+), `adminKey` exacto (si el fallo es en una prueba con clave admin).
3. Si después de eso la prueba de un **ataque** (SQLi, XSS, JWT manipulado, etc.) sigue devolviendo `200` o `500`, es un hallazgo de seguridad real — pasámelo (carpeta + nombre + código recibido) y lo corregimos en el backend correspondiente.
4. Las pruebas marcadas como "ALERTA" o con `console.warn` (CAT-06, ORD-03, CHAT-03, LMS-VOD-03) no rompen el test en rojo aunque el resultado no sea ideal — revisá la **consola de Postman** (abajo a la izquierda) para ver esos avisos, ya que ahí es donde vas a ver si hay algo para corregir aunque el test general haya pasado.
