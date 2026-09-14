# Corrección de seguridad en catálogo, órdenes, contacto, chat y QR — detalle técnico

**Fecha:** 1 de septiembre de 2026

Los 15 archivos descritos en este documento ya fueron subidos a la cuenta de Analuisa (repositorio
`mattso_repo`, rama `main`) y desplegados en producción. Este documento explica, archivo por archivo,
**qué tenía antes, a qué se cambió, y por qué** — para que cualquiera (persona o IA) que no haya visto
el proceso pueda ubicarse sin contexto adicional.

---

## Catálogo (3 archivos)

### `backend-matsso/src/catalog/catalog.controller.ts`

**Antes:** los métodos `createProduct` y `updateProduct` recibían el body como
`@Body() body: any` — sin ningún tipo ni validación. Cualquier campo, con cualquier valor, pasaba
directo al `catalogService`.

**Después:** `@Body() dto: CreateProductDto` y `@Body() dto: UpdateProductDto`. NestJS valida
automáticamente el body contra las reglas de esos DTOs *antes* de que el código del controller se
ejecute; si algo no cumple, corta con `400` sin llegar al service.

**Por qué:** al no existir ningún tipo, se podía mandar `"precio": -999` y el servidor lo guardaba tal
cual (prueba de seguridad CAT-06).

### `backend-matsso/src/catalog/dto/create-product.dto.ts` y `update-product.dto.ts` (nuevos)

**Antes:** no existían.

**Después:** definen exactamente qué campos acepta crear/actualizar un producto y con qué reglas:
- `tipo` debe ser `'CERTIFICACION'` o `'CAPACITACION'`, nada más.
- `titulo` obligatorio, no puede venir vacío.
- `precio` debe ser un número **mayor a 0.01** (`@Min(0.01)`).
- `horas`, si viene, debe ser al menos 1.
- El resto de campos (`descripcion`, `modalidad`, `fecha`, `horario`, `imagen_url`, `activo`,
  `destacado`) quedan opcionales pero tipados.

**Por qué:** son la pieza que realmente bloquea el precio negativo y cualquier dato con forma inválida.
Antes de esto no había ninguna regla escrita en ningún lado — el `any` del controller no validaba nada.

### `backend-matsso/src/catalog/catalog.service.ts`

**Antes:**
- Guardaba `titulo`, `descripcion` y `descripcion_larga` tal cual llegaban del cliente, sin tocar el
  texto, tanto al crear como al actualizar un producto.
- La respuesta pública del catálogo (`GET /api/catalog`) incluía un campo `cloudinaryFolder`, calculado
  con un mapeo interno `CLOUDINARY_FOLDER` de 49 códigos numéricos (`'001'`, `'002'`, ...) a nombres de
  carpetas de Cloudinary (ej. `'001': 'Actividades Auxiliares de Liniero'`).

**Después:**
- Esos tres campos de texto libre pasan por `sanitizePlainText()` antes de guardarse.
- Se quitó `cloudinaryFolder` de la respuesta pública, y con él todo el mapeo `CLOUDINARY_FOLDER` (ya
  no lo usa nadie). El campo `cloudinaryNum` **se mantiene**, porque ese sí lo usa el frontend para
  armar las URLs de las imágenes.

**Por qué:** sin sanear, un título como `<script>alert(1)</script>` se guardaba y se devolvía tal cual
en la respuesta pública del catálogo — XSS almacenado (prueba CAT-07). `cloudinaryFolder` era
información interna de la estructura de carpetas que no se usaba en ningún componente del frontend real
(se verificó buscando en todo `src/`); quitarla reduce lo que alguien externo puede ver de la
infraestructura interna sin perder ninguna funcionalidad visible.

---

## Chat / CertiBot (2 archivos)

### `backend-matsso/src/chat/chat.controller.ts`

**Antes:** `sendMessage(@Body('message') message: string)` — tomaba el campo `message` directo del
body. Si venía vacío devolvía un mensaje genérico ("Por favor, envíame un mensaje válido"), pero no
había ningún límite de longitud: se podía mandar un mensaje de miles de caracteres.

**Después:** `sendMessage(@Body() dto: SendMessageDto)`, usando el DTO nuevo, que exige que `message`
sea texto, no esté vacío, y tenga **máximo 500 caracteres**.

**Por qué:** antes se podía mandar un mensaje de 5000+ caracteres sin ningún rechazo (prueba CHAT-08),
lo que se puede usar para saturar el modelo de clasificación de intención de CertiBot o abusar del
servicio.

### `backend-matsso/src/chat/dto/send-message.dto.ts` (nuevo)

**Antes:** no existía.

**Después:** define el límite de 500 caracteres sobre el campo `message` (`@MaxLength(500)`).

**Por qué:** es la regla que efectivamente aplica el límite; sin este archivo el controller no tendría
nada contra qué validar.

---

## Contacto (2 archivos)

### `backend-matsso/src/contact/contact.controller.ts`

**Antes:** `receiveContact(@Body() body: { nombre: string; email: string; ... })` — un tipo definido en
línea, sin ningún decorador de validación, y **sin ningún guard de autenticación**. Cualquiera podía
llamar a este endpoint directamente sin haber iniciado sesión, aunque la pantalla de React solo mostraba
el formulario a usuarios logueados — esa restricción vivía únicamente en la interfaz, no en el servidor.

**Después:** se agregó `@UseGuards(JwtAuthGuard)` sobre el método, y el body ahora se tipa con
`CreateContactDto`.

**Por qué:** una restricción que solo existe en el frontend no protege nada — cualquiera puede llamar a
la API directamente con `curl` o Postman sin pasar nunca por la pantalla de React. Ahora el backend
exige el mismo token de sesión (`Authorization: Bearer`) que ya usa el resto del sitio.

### `backend-matsso/src/contact/dto/create-contact.dto.ts` (nuevo)

**Antes:** no existía (el tipado era la interfaz en línea mencionada arriba, sin ninguna regla).

**Después:** valida `email` con `@IsEmail()`, y pone límites de longitud (`@MaxLength`) a `nombre`
(200), `telefono` (20), `asunto` (200), `mensaje` (2000), `ciudad` (200) y `num_personas` (20).

**Por qué:** antes se podía mandar cualquier texto como "email" (ej. `"no-es-un-email"`) y mensajes de
tamaño arbitrario sin ningún rechazo.

### `backend-matsso/src/contact/contact.service.ts`

**Antes:** recibía los datos del formulario y los usaba directo para armar el HTML del correo que se
manda por Brevo — `nombre`, `mensaje`, `asunto` y `ciudad` se interpolaban tal cual
(`` `${dto.nombre}` ``, etc.) dentro del `htmlContent` del correo.

**Después:** antes de armar el correo, esos 4 campos pasan por `sanitizePlainText()`.

**Por qué:** al interpolar texto libre sin sanear dentro del HTML de un correo real, un remitente
malicioso podía inyectar etiquetas (por ejemplo `<img src=x onerror=alert(1)>`) que algunos clientes de
correo sí llegan a ejecutar (prueba CHAT-02). Importante: este endpoint no guarda nada en base de
datos, solo envía el correo — por eso la única forma de comprobar visualmente el saneo es revisando el
correo recibido, no la respuesta de la API.

---

## Órdenes (2 archivos)

### `backend-matsso/src/orders/orders.controller.ts`

**Antes:** después de subir el comprobante de pago, el código armaba el DTO a mano en vez de usar el
que ya existía:
```ts
const dto: CreateOrderDto = {
  items: parsedBody.items.map((i: any) => ({
    id: Number(i.id),
    cantidad: Number(i.cantidad) || 1,
  })),
};
```
`Number(i.cantidad) || 1` **no bloquea negativos** en JavaScript: `Number(-5) || 1` da `-5`, porque
`-5` es un valor "truthy" (el `|| 1` solo actúa si el número fuera `0`, `NaN` o vacío). Una cantidad
negativa pasaba tal cual hasta la base de datos. Además, en el mapa de "bytes mágicos" para detectar
el tipo real de archivo existía una entrada muerta para `'application/pdf'` que nunca se alcanzaba,
porque `'application/pdf'` ni siquiera estaba en la lista de tipos permitidos (`ALLOWED_MIME_TYPES`).

**Después:** se usa `plainToInstance(CreateOrderDto, parsedBody)` seguido de `validate()` de
`class-validator` antes de seguir. Si hay errores, corta con `400` y no crea nada. Se eliminó la
entrada muerta de `'application/pdf'`.

**Por qué:** el DTO `create-order.dto.ts` **ya existía desde antes** con las reglas correctas
(`@IsPositive()`, `@Max(10)` en cantidad), pero nunca se estaba usando de verdad — el controller
armaba su propio objeto a mano en vez de instanciar y validar ese DTO. Esto pasa porque el body de una
orden llega como un JSON-dentro-de-un-string (va empaquetado dentro de un `multipart/form-data` junto
con el archivo del comprobante), y el `ValidationPipe` global de NestJS no se dispara solo sobre un
campo de texto plano — había que invocar la validación manualmente, y ese paso faltaba. Por eso una
cantidad negativa (prueba ORD-03) se colaba a pesar de que el DTO parecía estar bien escrito.

### `backend-matsso/src/orders/orders.service.ts`

**Antes:** calculaba el `total` de la orden y lo guardaba sin ninguna comprobación adicional de que
fuera positivo.

**Después:** se agregó, justo antes de persistir la orden:
```ts
if (total <= 0) {
  throw new BadRequestException('El total de la orden debe ser mayor a 0.');
}
```

**Por qué:** es una segunda barrera (defensa en profundidad), independiente de la validación del DTO.
Hoy no hay ninguna combinación de datos que produzca un total inválido una vez arreglado el punto
anterior, pero si en el futuro se agrega algún descuento, cupón o promoción, esta línea evita que se
guarde una orden con total en cero o negativo por un error de cálculo.

---

## Certificados QR (2 archivos)

### `backend-matsso/src/qr-certs/qr-certs.controller.ts`

**Antes:** `create(@Body() body: any, ...)` — mismo patrón que catálogo, sin tipo ni validación.

**Después:** `create(@Body() dto: CreateQrCertDto, ...)`.

**Por qué:** mismo motivo que catálogo — sin DTO, cualquier campo con cualquier valor pasaba sin
validar.

### `backend-matsso/src/qr-certs/dto/create-qr-cert.dto.ts` (nuevo)

**Antes:** no existía.

**Después:** exige que `nombres` y `certificado` sean texto no vacío (máximo 200 caracteres cada uno),
y que `fecha_emision` y `fecha_expiracion` vengan presentes.

**Por qué:** mismo motivo que los demás DTOs nuevos — antes no había ninguna regla escrita para este
endpoint.

### `backend-matsso/src/qr-certs/qr-certs.service.ts`

**Antes:** guardaba `nombres` y `certificado` tal cual llegaban del body.

**Después:** ambos campos pasan por `sanitizePlainText()` antes de guardarse.

**Por qué:** estos dos campos se muestran **públicamente** en la ruta de verificación
`GET /api/verificar/:codigo` — sin sanear, un `<script>` guardado ahí se serviría tal cual a cualquier
persona que escanee o consulte ese código QR.

---

## Utilidad compartida (1 archivo)

### `backend-matsso/src/common/sanitize.util.ts` (nuevo)

**Antes:** no existía; cada lugar que necesitaba limpiar texto libre lo hacía distinto, o no lo hacía
en absoluto.

**Después:** una única función reutilizada en catálogo, contacto y QR:
```ts
export function sanitizePlainText<T extends string | null | undefined>(input: T): T {
  if (input == null) return input;
  return input.replace(/<[^>]*>/g, '').trim() as T;
}
```
Quita cualquier etiqueta HTML (todo lo que esté entre `<` y `>`) de un texto, y recorta espacios en los
extremos.

**Por qué:** tener una sola función centralizada evita que cada archivo la implemente distinto (o se le
olvide aplicarla) y permite corregirla o mejorarla en un solo lugar si hace falta en el futuro, en vez
de tener que buscar y actualizar la lógica repetida en varios servicios.
