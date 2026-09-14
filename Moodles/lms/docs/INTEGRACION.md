# Cómo integrar esto a `backend-matsso/` y al frontend

Todo el código nuevo vive en `Moodles/lms/` a propósito (ver la nota al pie del
README de esta carpeta) — nada de esto se movió todavía a `backend-matsso/src`
ni a `src/`. Esta es la lista exacta de pasos para hacerlo cuando decidas
integrarlo, en el orden en que hay que hacerlos.

## 1. Mover los archivos del backend

```bash
mkdir -p backend-matsso/src/lms
cp -r "Moodles/lms/backend/"* backend-matsso/src/lms/
```

Los `import` relativos ya están escritos asumiendo ese destino exacto
(`../../prisma/prisma.service`, `../../auth/jwt-auth.guard`, etc.) — no deberían
necesitar ajuste si el `cp` se hace tal cual.

## 2. Registrar el módulo

En `backend-matsso/src/app.module.ts`:

```diff
+ import { LmsModule } from './lms/lms.module';
  ...
  imports: [
    ...
    QrCertsModule,
+   LmsModule,
  ],
```

## 3. Agregar el método genérico de subida a `StorageService`

`backend-matsso/src/storage/storage.service.ts` solo tiene `uploadComprobante()`,
específico de órdenes. `submissions.service.ts` llama a
`uploadEntregaTarea()`, que no existe todavía. Es la única función de un
archivo *existente* que este trabajo necesita — se documenta aquí en vez de
tocar ese archivo directamente. Agregar junto a `uploadComprobante`:

```ts
async uploadEntregaTarea(file: Express.Multer.File): Promise<string> {
  if (!this.ready) {
    throw new InternalServerErrorException(
      'El almacenamiento de entregas no está configurado. Contacte al administrador.',
    );
  }
  const isRaw = file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png';
  const publicId = `lms/entregas/${randomUUID()}`;
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: isRaw ? 'raw' : 'image', overwrite: false, tags: ['entrega', 'lms', 'matsso'] },
      (error, result) => {
        if (error || !result) {
          this.logger.error('Error subiendo entrega a Cloudinary:', error?.message);
          reject(new InternalServerErrorException('No se pudo subir la entrega. Intenta de nuevo.'));
          return;
        }
        resolve(result.secure_url);
      },
    );
    uploadStream.end(file.buffer);
  });
}
```

(Mismo patrón que `uploadComprobante`, con carpeta y tags distintos.)

## 4. Conectar el webhook de inscripción al flujo real de aprobación de orden

Hoy `POST /api/lms/webhooks/enrollment` existe como endpoint HTTP con HMAC,
pero **nada lo llama todavía**. El punto de enganche real es donde
`orders.service.ts` (o el flujo de aprobación de pago) marca una orden como
pagada/aprobada. Ahí, por cada `OrdenItem` cuyo `Producto` tenga un `Course`
vinculado, y por cada persona de esa cantidad (normalmente 1), llamar
directamente al service — no por HTTP a sí mismo:

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

El endpoint HTTP+HMAC queda disponible para llamadas externas futuras (p.ej.
un alta manual desde Laravel), no para este caso.

## 5. Variables de entorno nuevas

Agregar a `backend-matsso/.env.example` y a las variables reales de Render:

| Variable | Para qué |
|---|---|
| `LMS_M2M_API_KEY` | Autentica a Laravel contra `/api/lms/admin/*`. Generar con `openssl rand -hex 32`, distinta de `ADMIN_API_KEY`. |
| `LMS_ENROLLMENT_WEBHOOK_SECRET` | Firma HMAC de `/api/lms/webhooks/enrollment`. Solo necesaria si de verdad se va a usar el endpoint HTTP (paso 4 alternativo); si todo el enrollment queda como llamada interna, esta variable puede no configurarse — el webhook simplemente rechazará todo con 401, lo cual es el comportamiento "falla cerrado" correcto. |

## 6. Prisma

El schema (`backend-matsso/prisma/schema.prisma`) ya tiene el schema `lms`
completo — no hace falta ninguna migración nueva para lo construido en esta
pasada. Sí correr `npx prisma generate` después de mover los archivos, para
que el cliente Prisma tenga los tipos actualizados si el schema cambió desde
la última generación.

## 7. Frontend

```bash
mkdir -p src/pages/lms src/components/lms
cp "Moodles/lms/frontend/api/lmsService.js" src/api/
cp "Moodles/lms/frontend/pages/"* src/pages/lms/
cp "Moodles/lms/frontend/components/"* src/components/lms/
```

Agregar las rutas en `src/App.jsx` (ver comentario al final de
`Moodles/lms/frontend/pages/MisCursos.jsx` con las rutas exactas sugeridas), y
agregar un link "Mis Cursos" en `Header.jsx` cuando el usuario esté logueado.

Instalar la dependencia del reproductor HLS:

```bash
npm install video.js
```

## 8. Qué falta después de integrar (no está en esta pasada)

- Tests de integración y de contrato con Laravel (criterio de terminado §8 de
  `arquitectura_lms_nube.md`) — no se escribieron pruebas automatizadas.
- Documentación OpenAPI/Swagger generada — no se instaló `@nestjs/swagger`.
- Auto-envío forzado de un intento de quiz al agotar `time_limit_seconds` (hoy
  el límite de tiempo es informativo para el frontend; el backend no lo hace
  cumplir por sí solo si el estudiante nunca llama a `submit`).
- Flujo de inscripción de varios cupos en una sola compra corporativa
  (`cantidad > 1`) — ver `Moodles/lms/docs/DECISIONES.md`.
- Vincular `Course.producto_id` a productos existentes y cargar contenido real
  — hoy no hay ningún curso creado, solo la capacidad de crearlos.
