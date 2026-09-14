# Estado de la integración — qué ya es real y qué falta

El código real vive en `backend-matsso/src/lms/` y en el proyecto separado
`aula-virtual/`. Lo que queda en `Moodles/lms/backend|frontend/` es una
copia **desactualizada** del primer borrador (antes de separar Moodle de
Coursera y antes del portón de pago) — no reflejan el diseño actual, se
recomienda borrarlos (ver `Moodles/lms/README.md`).

**Para la lista completa y accionable de qué hacer, en qué orden, ve
`Moodles/lms/docs/QUE_NECESITO_DE_TI.md`.** Esto de aquí es el detalle
técnico de respaldo.

## 1. Compilación — ya verificada de verdad, no solo escrita

Se instaló Node 22 y se corrió `npm install` + `npm run build` en los 3
proyectos (backend-matsso, sitio público, aula-virtual): los tres compilan
sin errores. Además se arrancó el backend real (`node dist/main.js`) con
credenciales de base de datos falsas a propósito — los 33 endpoints
`/api/lms/*` se mapean y el grafo de dependencias de NestJS resuelve sin
errores; el único fallo fue el esperado (no puede conectar a una BD que no
existe). En el camino se encontraron y corrigieron 2 bugs reales que no se
habían detectado antes por no poder compilar:

- `Enrollment.orden_item` sin relación inversa en `OrdenItem` (error de
  validación de Prisma).
- `StorageService.uploadEntregaTarea()` no existía — solo estaba documentado
  como pendiente.

`aula-virtual/package-lock.json` ya está generado y comiteado — el CI usa
`npm ci` en los 3 proyectos ahora.

## 2. Base de datos — script SQL ya generado, falta correrlo

`db_scripts/11_lms_schema.sql` (nuevo) tiene el SQL exacto para crear el
schema `lms` completo + la tabla `access_codes`, generado comparando el
schema real de `origin/main` contra esta rama con
`npx prisma migrate diff --script` — no escrito a mano, no probado contra
una base real todavía (no hay acceso a Supabase desde este entorno). Correrlo
en el SQL Editor de Supabase es el primer paso de `QUE_NECESITO_DE_TI.md`.

## 3. Variables de entorno nuevas

Ver `QUE_NECESITO_DE_TI.md` puntos 2-4 para dónde exactamente en Render/Vercel.
Resumen:

| Variable | Dónde |
|---|---|
| `LMS_M2M_API_KEY` | Render (backend) y sistema interno — debe ser idéntica en los dos. |
| `VITE_API_URL`, `VITE_SITIO_PUBLICO_URL` | Vercel del proyecto `aula-virtual`. |
| `VITE_AULA_VIRTUAL_URL` | Vercel del sitio público. |

## 4. Subdominio (Cloudflare + Vercel)

Pasos exactos en `QUE_NECESITO_DE_TI.md` punto 4 — pendiente de que el
usuario cree el proyecto en Vercel y el registro DNS en Cloudflare.

## 5. Conectar el webhook de inscripción al flujo real de aprobación de orden

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

## 6. Git — nada subido a GitHub todavía

Ver `QUE_NECESITO_DE_TI.md` punto 6 — no hay credenciales de git configuradas
en este entorno, se necesita que el usuario haga el push o comparta un
token de acceso.

## 7. Contenido real

No hay ningún curso creado todavía. Un profesor puede crear el suyo desde
`aula-virtual` una vez tenga cuenta con `rol=PROFESOR` (creada por el sistema
interno vía `POST /api/lms/admin/professors` — ya implementado y probado,
ver `REQUISITOS_SISTEMA_INTERNO.md`). Nadie va a tener acceso al Aula Virtual
hasta que exista al menos una orden pagada.

## 8. Qué falta, a propósito (no es un olvido)

- Tests automatizados (integración, contrato con el sistema interno).
- Swagger/OpenAPI.
- Auto-envío forzado de un intento de quiz al agotar `time_limit_seconds`
  (hoy es solo informativo en el frontend).
- Compra corporativa con `cantidad > 1` (ver `DECISIONES.md` §4).
- Selector de subida de archivos para el profesor (hoy pega la URL de
  Cloudinary a mano — ver `DECISIONES.md` §10).
- Auditoría persistente de operaciones admin/M2M (hoy son logs, no una tabla
  — ver `DECISIONES.md` §5).
