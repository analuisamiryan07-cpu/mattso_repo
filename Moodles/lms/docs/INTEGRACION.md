# Estado de la integración — qué ya es real y qué falta

Este documento describía antes una lista de pasos para "mover" el código
desde `Moodles/lms/` hacia el proyecto real. Eso ya se hizo — el código real
vive en `backend-matsso/src/lms/` y en el proyecto separado `aula-virtual/`.
Lo que queda de `Moodles/lms/backend|frontend/` es una copia de referencia,
no la fuente de verdad. Esto documenta qué falta para que funcione en una
URL real.

## 1. Instalar dependencias (bloqueante — no hay Node en este entorno)

Este trabajo se hizo sin poder correr `npm install`/`npm run build` en ningún
momento — hay que verificarlo apenas se pueda:

```bash
cd backend-matsso && npm install && npx prisma generate && npm run build
cd ../aula-virtual && npm install && npm run build
cd .. && npm run build   # sitio público — confirmar que sigue compilando tras quitar /aula-virtual
```

`aula-virtual/` no tiene `package-lock.json` todavía — generarlo con el
primer `npm install` y comitearlo (el job de CI usa `npm install` en vez de
`npm ci` por esto mismo, ver `.github/workflows/ci.yml`).

## 2. Variables de entorno nuevas

| Dónde | Variable | Para qué |
|---|---|---|
| Render (backend) | `LMS_M2M_API_KEY` | Autentica al sistema interno contra `/api/lms/admin/*`. `openssl rand -hex 32`, distinta de `ADMIN_API_KEY`. |
| Vercel (aula-virtual) | `VITE_API_URL` | Mismo backend que el sitio público. |
| Vercel (aula-virtual) | `VITE_SITIO_PUBLICO_URL` | Para "Crear cuenta" y el link de vuelta al sitio. |
| Vercel (sitio público) | `VITE_AULA_VIRTUAL_URL` | El botón del header apunta aquí — no publicar ese botón hasta tener esta URL real. |

`LMS_ENROLLMENT_WEBHOOK_SECRET` (del webhook de inscripción) sigue sin ser
necesaria — ver punto 4.

## 3. Subdominio (Cloudflare + Vercel)

Ver `aula-virtual/README.md` — pendiente de que el dominio de Cloudflare esté
listo para crear el subdominio (`aula.sapper-industries.com` o el que se
elija). El código no depende de esto para funcionar en local/preview.

## 4. Conectar el webhook de inscripción al flujo real de aprobación de orden

Sigue sin conectarse. El punto de enganche real es donde `orders.service.ts`
(o el flujo de aprobación de pago) marca una orden como pagada. Ahí, por cada
`OrdenItem` cuyo `Producto` tenga un `Course` vinculado, llamar directamente
al service — no por HTTP a sí mismo:

```ts
// dentro de OrdersService (o PaypalService al capturar el pago), inyectando EnrollmentService
await this.enrollmentService.enrollFromEcommerce({
  event_id: `orden-item-${ordenItem.id}`,
  usuario_id: Number(orden.usuario_id),
  producto_id: Number(ordenItem.producto_id),
  orden_item_id: Number(ordenItem.id),
  source: 'ECOMMERCE',
});
```

## 5. Contenido real

No hay ningún curso creado todavía. Un profesor puede crear el suyo desde
`aula-virtual` una vez tenga cuenta con `rol=PROFESOR` (asignado por el
sistema interno — ver `REQUISITOS_SISTEMA_INTERNO.md`), pero nadie va a
tener acceso al Aula Virtual hasta que exista al menos una orden pagada
ligada a un `Course` real.

## 6. Qué falta, a propósito (no es un olvido)

- Tests automatizados (integración, contrato con el sistema interno).
- Swagger/OpenAPI.
- Auto-envío forzado de un intento de quiz al agotar `time_limit_seconds`
  (hoy es solo informativo en el frontend).
- Compra corporativa con `cantidad > 1` (ver `DECISIONES.md` §4).
- Selector de subida de archivos para el profesor (hoy pega la URL de
  Cloudinary a mano — ver `DECISIONES.md` §10).
- Auditoría persistente de operaciones admin/M2M (hoy son logs, no una tabla
  — ver `DECISIONES.md` §5).
