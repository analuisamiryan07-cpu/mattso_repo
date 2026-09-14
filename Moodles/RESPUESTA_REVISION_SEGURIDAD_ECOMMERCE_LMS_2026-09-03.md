# Respuesta a la revisión de seguridad — e-commerce y colección LMS

**Fecha:** 3 de septiembre de 2026
**Responde a:** `Moodles/REVISION_SEGURIDAD_ECOMMERCE_LMS_2026-09-03.md`

Este documento es autocontenido: no requiere haber leído la conversación previa. Resume qué se
corrigió en respuesta a cada uno de los 13 puntos de la revisión, qué evidencia existe realmente hoy,
y qué queda pendiente. **No se realizó ningún despliegue nuevo a producción** — todos los cambios de
código descritos aquí quedaron en el árbol de trabajo local, sin subir ni desplegar, a la espera de
revisión y aprobación explícita.

---

## Estado punto por punto

### 1. Actualizar la colección Postman conforme a los hallazgos — **hecho**
Se editó `Moodles/MATSSO_LMS_Security.postman_collection.json` directamente. Sigue teniendo 96
requests (72 de e-commerce real en carpetas 00–09, 24 de LMS planeado en carpetas 10–12) — no se
borró ni se agregó ningún request, solo se corrigieron los scripts de prueba y las cabeceras.

### 2. Endurecer CAT-06, ORD-03 y CHAT-08 — **hecho**
Antes, las tres tenían una rama que aceptaba el ataque como "revisar manualmente" con una aserción
`pm.expect(true).to.equal(true)` (siempre verde) o solo comprobaban "no es 500". Ahora:
- **CAT-06** (precio negativo): única aserción `pm.expect(code).to.be.oneOf([400,422])`. Si el precio
  negativo se acepta, el test **falla en rojo**.
- **ORD-03** (cantidad negativa): mismo patrón, `oneOf([400,422])` estricto.
- **CHAT-08** (mensaje > 500 caracteres): antes solo exigía "no 500"; ahora exige exactamente `400`.

### 3. Corregir CHAT-01/02/03 para enviar JWT — **hecho**
Las tres ahora incluyen el header `Authorization: Bearer {{studentToken}}` (el endpoint
`/api/contacto` exige sesión desde la corrección de seguridad ya desplegada). Además:
- `CHAT-01` ahora exige `200/201` con sesión válida (antes lo exigía sin sesión, lo cual ya no aplica).
- `CHAT-03` (email inválido) ahora exige `400` exacto en vez de solo "no es 500", acorde a la
  validación `@IsEmail()` ya desplegada.

### 4 y 5. Separar e-commerce de LMS planeado; no contar 404 como aprobado — **hecho**
Las 24 pruebas de las carpetas 10, 11 y 12 se reescribieron con este patrón:
```js
if (pm.response.code === 404) {
    pm.test.skip('<nombre> — endpoint LMS no implementado (planeado)');
} else {
    pm.test('<nombre>', function() { pm.expect(pm.response.code).to.be.oneOf([...códigos reales...]); });
}
```
Un `404` ahora se reporta como **omitido** (`pm.test.skip`) en el resultado de Newman/Postman, nunca
como aprobado. Se agregó además una nota explícita en la descripción de cada una de las tres carpetas
LMS: *"NO CUENTA para el veredicto de seguridad del e-commerce actual."*

### 6. Sustituir el test siempre verdadero de LMS-VOD-03 — **hecho**
Reescrito con lógica real: si el endpoint no existe (`404`) queda omitido explícitamente; si existe y
responde `200/201`, ahora sí verifica que el cuerpo de la respuesta no indique el video como
completado ni el quiz como desbloqueado en el primer ping al 100%; si responde con un código de
rechazo, exige que sea `400/403/422`. Ya no hay ninguna rama que apruebe sola.

### 7. Eliminar la contraseña exportada — **hecho parcialmente, acción pendiente para el equipo**
Se reemplazó `studentPassword` en la colección por un placeholder
(`REEMPLAZA_CON_PASSWORD_DE_PRUEBA_NO_REAL`) — ya no viaja en texto claro en el archivo.

**Verificación de si la cuenta existe en producción:** se intentó un login real contra
`https://tikky-hg4n.onrender.com/api/auth/login` con `sec.test@matsso.local` /
`S3cur!tyT3st#2024` (la credencial que estaba expuesta). La respuesta fue `400` por validación de
formato de correo ("Debe ingresar un correo electrónico válido"), porque el dominio `.local` no pasa el
validador de email del endpoint. **Este resultado es inconcluyente**: no confirma ni descarta que la
cuenta exista en la base de datos real, solo indica que con las reglas de validación actuales no se
puede iniciar sesión con ese correo por su formato, exista o no la fila en la tabla de usuarios.

**Acción pendiente (requiere acceso directo a la base de datos, no disponible desde aquí):** buscar
`sec.test@matsso.local` en la tabla de usuarios de producción. Si existe, eliminarla o rotar su
contraseña. Tratar la contraseña `S3cur!tyT3st#2024` como comprometida de aquí en adelante, exista o
no la cuenta, porque estuvo en un archivo que se maneja como parte del proyecto.

### 8. Verificar fechas ISO y orden cronológico en certificados QR — **hecho (código, no desplegado)**
`backend-matsso/src/qr-certs/dto/create-qr-cert.dto.ts` solo exigía `@IsNotEmpty()` en
`fecha_emision`/`fecha_expiracion` — aceptaba cualquier texto no vacío. Se agregó:
- `@IsISO8601()` en ambos campos (deben ser fechas reales en formato ISO, no cualquier string).
- Un validador personalizado (`ExpiracionNoAnteriorAEmision`) que rechaza la combinación si
  `fecha_expiracion` es anterior a `fecha_emision`.

### 9. Escape por contexto en el HTML de correos — **hecho (código, no desplegado)**
Se agregó `escapeHtml()` en `backend-matsso/src/common/sanitize.util.ts` (escapa `& < > " '`) y se
aplicó en `contact.service.ts` sobre **todos** los campos que se interpolan en el HTML del correo
(`nombre`, `email` — incluido dentro del atributo `href="mailto:..."` —, `telefono`, `ciudad`,
`num_personas`, `asunto`, `mensaje`). Esto queda como defensa adicional sobre `sanitizePlainText()`
(que solo quita etiquetas completas); el escape por contexto cubre casos que una expresión regular de
etiquetas no garantiza (fragmentos malformados, ruptura de atributos, etc.), tal como señalaba la
revisión.

### 10. Confirmar que el mensaje de uploads no mencione PDF — **confirmado el problema, corregido**
Se comprobó: `ALLOWED_MIME_TYPES` en `orders.controller.ts` solo incluye
`['image/jpeg', 'image/png', 'image/webp']` — PDF nunca estuvo permitido ahí — pero el mensaje de
error decía *"Solo imágenes JPG, PNG, WebP y PDF."* Se corrigió el texto a
*"Solo imágenes JPG, PNG o WebP."*

### 11. No ejecutar pruebas mutantes directamente en producción — **reconocido, no resuelto retroactivamente**
Las pruebas manuales hechas en esta sesión (CAT-06, CAT-07, ORD-06, CHAT-01/02) **sí se ejecutaron
contra la producción real** (`https://tikky-hg4n.onrender.com`), antes de que existiera esta
instrucción explícita. Ver la sección de limpieza más abajo para el detalle de lo que quedó como
consecuencia. De aquí en adelante no se deben repetir ejecuciones mutantes contra producción.

### 12. Ejecutar primero en staging/desechable y conservar reporte Newman — **no se pudo completar; ver limitaciones**
Ver la sección "Ejecución de Newman" más abajo — no existe hoy un ambiente de staging para este
proyecto (Render solo tiene el ambiente "Production" con el servicio `Tikky`), y este entorno de
trabajo no tiene Node.js/npm instalado, por lo que no se pudo ejecutar Newman desde aquí.

### 13. Confirmar que no quedaron productos, órdenes, usuarios o correos de prueba — **verificado, limpieza pendiente**
Ver la sección de limpieza.

---

## Ejecución de Newman

**No se generó ningún reporte Newman real.** Verificado explícitamente: no hay `node`, `npm`, `npx`
ni `newman` instalados en este entorno de ejecución, y el proyecto solo tiene un ambiente
("Production") en Render — no hay staging ni ambiente desechable configurado.

**Comando exacto que se debe ejecutar** una vez que exista un ambiente apropiado (staging, o local con
`docker-compose`/`npm run start:dev` apuntando a una base de datos desechable, nunca contra
`https://tikky-hg4n.onrender.com`):

```bash
npm install -g newman newman-reporter-htmlextra

newman run "Moodles/MATSSO_LMS_Security.postman_collection.json" \
  --env-var baseUrl=http://localhost:3000 \
  --env-var adminKey=<ADMIN_API_KEY_DE_STAGING> \
  --env-var lmsApiKey=<LMS_KEY_DE_STAGING_SI_APLICA> \
  --reporters cli,json,htmlextra,junit \
  --reporter-json-export "reportes/newman-$(date +%Y%m%d-%H%M%S).json" \
  --reporter-junit-export "reportes/newman-$(date +%Y%m%d-%H%M%S).xml" \
  --reporter-htmlextra-export "reportes/newman-$(date +%Y%m%d-%H%M%S).html"
```

Notas sobre el comando:
- `baseUrl` debe apuntar a un ambiente desechable, **nunca** a la URL de producción.
- Las carpetas `06 · Órdenes` (ORD-02, ORD-03, ORD-06) requieren adjuntar un archivo real al campo
  `comprobante` — Newman soporta esto vía `--folder` corrida aparte o generando la colección con los
  archivos ya adjuntos localmente antes de ejecutar (Newman sí lee archivos adjuntos en `formdata` si
  la ruta es válida en el sistema donde corre, a diferencia de la app de escritorio de Postman que
  requiere adjuntarlos manualmente cada vez).
- Conservar los tres reportes (JSON, JUnit, HTML) como evidencia, con fecha en el nombre de archivo.

**Ambiente utilizado en esta sesión:** ninguno propio — las verificaciones manuales previas a esta
respuesta (documentadas en `Moodles/DESPLIEGUE_VERIFICACION_FIX_SEGURIDAD_2026-09-01.md`) se hicieron
a mano, request por request, directamente contra `https://tikky-hg4n.onrender.com` (producción). Esta
respuesta a la revisión no repitió esas ejecuciones.

**Totales — solo de la colección (análisis estático, no ejecución real):**

| Métrica | Valor |
|---|---|
| Requests totales | 96 |
| Requests de e-commerce real (carpetas 00–09) | 72 |
| Requests de LMS planeado (carpetas 10–12) | 24 |
| Llamadas `pm.test()` reales (potencialmente aprobadas/falladas) | 110 |
| Llamadas `pm.test.skip()` (omitidas explícitamente si el endpoint LMS no existe) | 24 |
| Aprobados / Fallidos reales | **pendiente — requiere ejecución real con Newman, no fabricado aquí** |

---

## Limpieza posterior

Estado verificado de lo que quedó en producción por las pruebas manuales de esta sesión (antes de la
instrucción de no ejecutar más pruebas mutantes ahí):

| Qué | Estado | Acción pendiente |
|---|---|---|
| Productos de prueba en catálogo (ids `121`, `127`, `128`, título `<script>...` / `alert('xss')`) | Confirmado en el panel admin, marcados "Inactivo" | Borrar manualmente desde el panel de administración |
| Orden creada por `ORD-06` (la prueba con `fake.jpg` que dio `400` correctamente) | No se creó orden (fue rechazada) | Ninguna — este caso no dejó datos |
| Orden creada por una ejecución anterior de `ORD-06` sin archivo adjunto real, que dio `201` | Se creó una orden real con un comprobante subido a Cloudinary | **Pendiente**: localizar y anular/eliminar esa orden de prueba y su comprobante |
| Correos de prueba de `CHAT-01`/`CHAT-02` | Se enviaron y confirmaron recibidos en `melanyanaluisa76@gmail.com` (variable `CONTACT_DEST_EMAIL` puesta temporalmente para esa verificación) | **Pendiente**: revertir `CONTACT_DEST_EMAIL` en Render a `matssoecuador@gmail.com` (o eliminar la variable) |
| Cuenta `sec.test@matsso.local` | No se pudo confirmar ni descartar su existencia (ver punto 7) | Verificar directamente en base de datos y eliminar/rotar si existe |
| Usuarios/productos/órdenes reales de clientes | No se tocó ninguno | — |

---

## Riesgos pendientes

1. **No hay ambiente de staging.** Todo lo verificado hasta ahora (por esta revisión y por las pruebas
   manuales previas) se hizo contra producción. Mientras no exista un ambiente desechable, cualquier
   corrida futura de la colección seguirá teniendo el mismo problema que señaló la revisión.
2. **Newman no se pudo ejecutar desde este entorno.** No hay evidencia reproducible (JSON/JUnit/HTML)
   de que la colección corregida realmente pase — solo se verificó estáticamente que los scripts ya no
   se autoaprueban.
3. **Cuenta de prueba con contraseña históricamente expuesta** (`sec.test@matsso.local`) sin confirmar
   si existe en producción.
4. **Variable `CONTACT_DEST_EMAIL` sigue apuntando a un correo personal** (`melanyanaluisa76@gmail.com`)
   en el ambiente de producción real, pendiente de revertir.
5. **Bug de confiabilidad no cubierto por esta lista de 13 puntos, pero relacionado:** en
   `contact.service.ts`, si la llamada a la API de Brevo falla, el `catch` solo registra el error en el
   log y la función igual retorna `{ success: true, ... }` — el cliente nunca se entera de que su
   mensaje no llegó. No se corrigió en esta pasada por no estar en el alcance solicitado; queda
   anotado para una corrección futura.
6. **Dos sistemas de correo configurados en paralelo** (`GMAIL_USER`/`GMAIL_APP_PASSWORD` vs
   `BREVO_API_KEY`/`BREVO_SENDER_EMAIL`) en las variables de entorno de Render — no es un hallazgo de
   seguridad, pero es una fuente probable de confusión operativa.
7. **Órdenes con `comprobante` real (ORD-02, ORD-03, ORD-06) no se pueden probar de forma totalmente
   automática con Postman de escritorio** sin adjuntar el archivo manualmente cada vez — al migrar a
   Newman, hay que resolver esto con archivos fijos en el repositorio de pruebas (no reales, pero con
   los bytes correctos para pasar/fallar cada caso a propósito).

---

## Confirmación final

No se ejecutó `git push`, `git merge` ni ningún despliegue en Render/Vercel como parte de esta
respuesta. Los tres archivos de código modificados existen únicamente en el árbol de trabajo local:

- `backend-matsso/src/orders/orders.controller.ts` (mensaje de error sin mención a PDF)
- `backend-matsso/src/qr-certs/dto/create-qr-cert.dto.ts` (fechas ISO + orden cronológico)
- `backend-matsso/src/common/sanitize.util.ts` y `backend-matsso/src/contact/contact.service.ts`
  (escape por contexto en el correo)

Quedan a la espera de revisión antes de subir y desplegar.
