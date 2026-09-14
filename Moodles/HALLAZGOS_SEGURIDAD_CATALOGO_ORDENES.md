# Correcciones de seguridad aplicadas — Catálogo, Órdenes, Contacto y Chat

Origen: pruebas manuales con `Moodles/MATSSO_LMS_Security.postman_collection.json`
(carpetas 05 · Catálogo y 06 · Órdenes) más revisión directa del código. Todos
los puntos de este documento ya están **implementados en el código**, no son
propuestas. Se conserva solo lo necesario para saber qué se hizo y por qué.

## 1. Precio negativo / datos sin validar en catálogo — corregido

`backend-matsso/src/catalog/catalog.controller.ts` recibía `createProduct`/`updateProduct` como `body: any`, sin DTO — por eso pasaba un precio de `-999`.

- Creados `backend-matsso/src/catalog/dto/create-product.dto.ts` y `update-product.dto.ts` con `@Min(0.01)` en precio, `@IsIn(['CERTIFICACION','CAPACITACION'])` en tipo, y tipado del resto de campos.
- `catalog.controller.ts` ahora recibe `@Body() dto: CreateProductDto` / `UpdateProductDto` en vez de `any`.

## 2. XSS almacenado — saneo de texto libre en todo el sistema

Se creó un util compartido `backend-matsso/src/common/sanitize.util.ts` (`sanitizePlainText`, quita cualquier etiqueta HTML) y se aplicó en **todos** los lugares donde se detectó el mismo patrón (DTO ausente + texto libre sin sanear):

- `catalog.service.ts` — `titulo`, `descripcion`, `descripcion_larga` (crear y actualizar producto).
- `contact.service.ts` — `nombre`, `mensaje`, `asunto`, `ciudad`, antes de guardarlos y antes de interpolarlos en el HTML del correo que arma Brevo.
- `qr-certs.service.ts` — `nombres`, `certificado` (se encontró de paso al auditar el resto de controllers: mismo patrón `body: any`, y esos campos se muestran en la ruta pública `GET /api/verificar/:codigo`).

Se auditaron todos los `*.controller.ts` de `backend-matsso/src` buscando `@Body() body: any` o interfaces inline — confirmado que ya no queda ninguno.

## 3. Cantidad negativa en órdenes — corregido en la causa raíz real

El DTO de `create-order.dto.ts` (`@IsPositive()`, `@Max(10)`) ya era correcto, pero `orders.controller.ts` nunca lo usaba: parseaba el JSON a mano y armaba un objeto plano con `Number(i.cantidad) || 1`, que no bloquea negativos en JavaScript.

- `orders.controller.ts` ahora usa `plainToInstance(CreateOrderDto, parsedBody)` + `validate()` antes de continuar; si hay errores, `400` y no se crea nada (ni la orden, ni el ítem, ni se sube el comprobante).
- `orders.service.ts` — se agregó rechazo explícito si el `total` calculado es `<= 0`, como defensa en profundidad adicional.

## 4. Autoaprobación de estado — confirmado que ya estaba resuelto (sin cambio de código)

Se revisó `orders.service.ts` a fondo: el `estado` de una orden nueva se asigna siempre como `'PENDIENTE'` directamente en el `data` del `prisma.orden.create()` — el DTO de creación nunca declaró un campo `estado`, y el valor nunca se lee del body del cliente. Mismo caso confirmado en el flujo de PayPal (`payments/paypal/paypal.service.ts`). No requería ningún cambio.

## 5. MIME spoofing en comprobantes — ya estaba resuelto; se hizo la limpieza pendiente

`orders.controller.ts` ya verificaba los bytes reales del archivo (`verifyMagicBytes`), no solo el `Content-Type`. Se eliminó la única entrada muerta que quedaba: la verificación de `application/pdf` en `MAGIC_BYTES`, que nunca se alcanzaba porque `'application/pdf'` no está en `ALLOWED_MIME_TYPES`.

## 6. IDs autoincrementales — decisión tomada, sin cambio de código

- **Producto (catálogo):** el catálogo es público a propósito; no hay nada que ocultar ahí, y el cliente necesita un identificador del producto para poder comprarlo (hasheado o no). No se toca.
- **Orden:** se decidió mantener el `id` real en la respuesta porque hace falta para el cliente y para uso interno. Confirmado que hoy no existe ningún endpoint donde un cliente normal (solo JWT) pueda consultar una orden ajena por ID — la protección real es `x-admin-key` (rutas admin) y la verificación de dueño que ya existe en la captura de PayPal. **Regla fija para el futuro:** si se construye una pantalla de "mis pedidos", ese endpoint nuevo debe filtrar siempre por `where: { id, usuario_id: request.user.id }`.
- El campo `cloudinaryFolder` (estructura interna de carpetas de Cloudinary, sin uso en el frontend) se quitó de la respuesta de `GET /api/catalog` en `catalog.service.ts`; `cloudinaryNum` se mantiene porque sí se usa para las imágenes.

## 7. Formulario de Contacto — corregido

- Creado `backend-matsso/src/contact/dto/create-contact.dto.ts` (`@IsEmail()`, `@MaxLength()` en cada campo).
- `contact.controller.ts` ahora exige `@UseGuards(JwtAuthGuard)` — antes el backend no pedía sesión aunque la pantalla de React sí la simulaba.
- `contact.service.ts` sanea `nombre`/`mensaje`/`asunto`/`ciudad` antes de guardarlos y antes de armar el HTML del correo.
- Confirmado (no era cierto lo que se había documentado antes): el mensaje **solo** se envía por correo vía Brevo. El número de WhatsApp en `Contacto.jsx` es un enlace estático sin relación con el formulario.

## 8. CertiBot — corregido

- `certibot/main.py`: `Mensaje.texto` ahora tiene `max_length=500` (antes aceptaba 5000+ caracteres sin límite).
- `verificar_clave()` ahora falla cerrado: si `API_KEY` no está configurada, responde `503` en vez de dejar el endpoint `/chat` abierto sin autenticación en silencio.
- `backend-matsso/src/chat/dto/send-message.dto.ts` (nuevo) — mismo límite de 500 caracteres en el proxy NestJS, que es el que usa el widget real del sitio.
- Prompt injection (CHAT-05/06): confirmado que no aplica porque CertiBot es un clasificador Keras con respuestas fijas, no un LLM — no requiere cambio, solo queda anotado que esto cambia si algún día se reemplaza por un LLM real.

## 9. PayPal (PAY-03/PAY-04) — confirmado correcto, sin cambio de código

Verificado en `paypal-webhook.service.ts`/`paypal-api.service.ts`: si la firma del webhook es inválida, se descarta antes de tocar cualquier orden. El `200 OK` que ve PayPal es solo el acuse de recibo exigido por su protocolo, no una aprobación.

---

## Aparte, fuera del código de este proyecto

- Se eliminó un repositorio git accidental en `/home/capaglob/Descargas` que tenía en su único commit un `.zip` de 693MB con `.env` reales, el dump de la base de datos y la clave de la cuenta de servicio de Google — nunca llegó a subirse a GitHub, pero se borró para que no quedara la posibilidad.
- Pendiente de que el usuario haga manualmente (no es algo que se resuelva en este repositorio): rotar `ADMIN_API_KEY`, `JWT_SECRET`, `CLOUDINARY_API_SECRET`, `BREVO_API_KEY` y la contraseña de PostgreSQL, ya que viajaban en ese `.env` comprometido.
