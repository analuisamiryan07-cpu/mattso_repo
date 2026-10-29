# Encargo implementable: administración LMS en el servidor local

## Decisión arquitectónica y alcance

Leer completamente Moodles/arquitectura_lms_local.md, arquitectura_lms_nube.md y arquitectura_lms.md. Estos documentos describen un LMS propio, NO una instalación del producto Moodle. Si se desea Moodle real, detenerse y acordar una arquitectura distinta antes de instalarlo.

Servidor: matt@192.168.100.18. Producción Laravel: /home/matt/proyecto_matt. El directorio /home/matt/staging_backoffice_20260901 existe históricamente, pero debe comprobarse su aislamiento antes de usarlo: una carpeta distinta no garantiza una base distinta.

Trabajar en una réplica exclusiva LMS y una base de pruebas separada, sin credenciales ni conexiones a matssoecuador. No ejecutar migraciones ni workers contra producción. Sin Git. No cambiar DocumentGenerationService, plantillas, documentos, asistencia, móviles, pagos, CertiBot ni el catálogo existente.

Laravel administra y sincroniza. NestJS es dueño de cursos, módulos, contenidos, matrículas, avances, evaluaciones y notas en Supabase. No crear duplicados autoritativos de esas entidades en PostgreSQL local. No instalar otro servidor Moodle, Redis o servicios globales por suposición.

## Estado inspeccionado y puntos de extensión

- composer.json requiere Laravel ^12.0 y PHP ^8.2; comprobar versiones instaladas con composer.lock y runtime, sin actualizar dependencias.
- routes/web.php ya contiene el grupo auth y el grupo admin con middleware role:User::ROLE_ADMIN. Integrar las rutas LMS dentro de esos controles; no basta ocultar un menú.
- CatalogApiService es del catálogo existente. NO reutilizar su secreto x-admin-key ni cambiarlo para LMS. Crear un cliente separado.
- Las rutas y clases de abajo son PROPUESTAS de implementación: no se presentan como ya disponibles.

## Fase 1: contrato y cliente aislado

Crear config/lms.php con LMS_ENABLED=false por defecto, LMS_API_BASE_URL sin URL productiva predeterminada y credenciales M2M exclusivas de servidor. Verificar HTTPS; no usar verify=false. No copiar ni imprimir .env.

Crear app/Services/Lms/LmsApiClient.php. Definir timeout y connect timeout acotados, ID de correlación y tratamiento explícito de 401/403/409/422/429/5xx. Reintentar escrituras únicamente con clave de idempotencia estable y contrato remoto que garantice deduplicación.

Acordar OpenAPI con el equipo nube ANTES de llamar a endpoints reales. El documento histórico solo propone:

- POST /api/admin/courses
- POST /api/admin/modules
- POST /api/admin/modules/content
- GET /api/admin/submissions/pending
- POST /api/admin/submissions/{id}/grade

Faltan contratos de listar, consultar, actualizar y ordenar, carga de documentos, estados asíncronos y reconciliación. Confirmar sus rutas, JSON, UUID, paginación, autenticación, permisos, idempotencia y límites; no inventar que existen. Una nota enviada debe identificar al administrador local de manera auditable sin confiar en un ID suministrado libremente por el navegador.

## Fase 2: persistencia técnica y migraciones

Sí se requieren migraciones NUEVAS para estado técnico local. Propuesta: tablas public.lms_sync_operations y public.lms_uploads, con nombres sin colisiones. Revisar permisos del rol antes de diseñar el despliegue; no asumir que el rol Laravel puede hacer DDL. No recrear el esquema gestion.

1. lms_sync_operations:
   - id UUID; idempotency_key UUID UNIQUE; tipo de operación y resource_remote_id nullable.
   - estado (pending, processing, succeeded, retryable_failed, permanently_failed); attempts, next_attempt_at, locked_at, lease_token, completed_at.
   - payload mínimo necesario, sin credenciales; versión y huella del payload para impedir reutilizar la clave con contenido distinto.
   - actor administrativo según modelo local comprobado; correlation_id; last_error_code sanitizado; timestamps.
   - índice sobre estado/next_attempt_at. Reserva atómica de operaciones y lease recuperable para evitar doble ejecución y bloqueos perpetuos.
2. lms_uploads:
   - id UUID, relación a operación, disco/ruta privada temporal, bytes, MIME verificado, SHA-256.
   - proveedor/public_id/version, duración, estado de procesamiento y metadatos remotos mínimos.
   - estados separados: recibido, subido, procesando, pendiente de registrar, confirmado y fallido.
   - TTL y limpieza segura de temporales; no borrar material remoto compartido por fallo parcial.

Usar migraciones con down limitado a tablas nuevas y advertencia de pérdida de pendientes. No ejecutar migrate:fresh, reset, rollback global ni migrate indiscriminado en producción. Preparar revisión de SQL y lista exacta de migraciones pendientes antes de cualquier autorización.

Las tablas jobs/failed_jobs ya figuran en el inventario histórico. Comprobar configuración y compatibilidad: no volver a crearlas. Usar cola exclusiva lms. Si no se usa esa infraestructura, justificar alternativa sin instalar servicios adicionales.

## Fase 3: rutas administrativas y vistas Blade

Crear controladores bajo app/Http/Controllers/Admin/Lms/, FormRequests dedicados y vistas resources/views/admin/lms/. Todas las mutaciones con CSRF, autorización y validación en servidor; IDs remotos se validan y autorizan.

Propuesta de rutas locales dentro del grupo admin:

| Método | Ruta | Responsabilidad |
|---|---|---|
| GET | /admin/lms/cursos | Lista remota y estado técnico local |
| GET | /admin/lms/cursos/nuevo | Formulario |
| POST | /admin/lms/cursos | Encolar creación idempotente |
| GET | /admin/lms/cursos/{course}/editar | Consultar curso autorizado |
| PATCH | /admin/lms/cursos/{course} | Encolar edición |
| POST | /admin/lms/cursos/{course}/modulos | Crear módulo |
| PATCH | /admin/lms/modulos/{module} | Editar/ordenar módulo |
| POST | /admin/lms/modulos/{module}/contenidos | Registrar contenido |
| POST | /admin/lms/cargas | Recibir archivo privado validado |
| GET | /admin/lms/operaciones/{operation} | Estado autorizado, sin payload sensible |
| POST | /admin/lms/operaciones/{operation}/reintentar | Reintento auditado, misma clave |
| GET | /admin/lms/entregas | Entregas pendientes remotas |
| POST | /admin/lms/entregas/{submission}/calificacion | Calificar mediante API |

No añadir borrado de cursos/contenidos sin contrato, retención y autorización definidos. Ocultar menú y deshabilitar rutas cuando LMS_ENABLED=false.

## Fase 4: archivos y workers

Crear CloudinaryVideoService y jobs separados para cargar, consultar procesamiento y registrar metadatos. Los videos viajan Laravel → Cloudinary, NO Laravel → NestJS. Si la carga termina y el registro remoto falla, conservar public_id y reintentar solo el registro. No marcar sincronizado antes de confirmación remota.

No aceptar MIME, duración ni URL remota declarados por el navegador como confiables. Límites de tamaño/tipo configurables y concordantes con PHP/Nginx; acordar tamaño máximo antes de modificar el servidor. Guardar archivos fuera de public. No exponer secretos de Cloudinary, URLs de administración ni claves M2M al frontend o logs.

Preparar unidad worker para cola lms y recolección de operaciones con lease vencido. No instalarla ni iniciarla hasta aprobación: definir usuario no-root, permisos mínimos, timeout menor que retry_after, reinicio controlado y ruta exacta del release.

## Fase 5: pruebas obligatorias

- HTTP fake con rechazo de llamadas no previstas; ninguna llamada accidental a nube productiva.
- No autenticado, rol no permitido, CSRF y acceso a recursos de otro actor.
- Doble envío/timeout después de aceptar: un único curso, contenido o calificación.
- Cloudinary exitoso + NestJS fallido: reintento sin segunda carga.
- Credenciales inválidas, 422, 429 con Retry-After, 5xx y agotamiento de intentos.
- Caída del worker: lease recuperable, misma idempotency_key.
- Migraciones y concurrencia en PostgreSQL AISLADO; SQLite solo no demuestra bloqueos PostgreSQL.
- Archivos inválidos/excesivos, nombres hostiles y ausencia de secretos en logs/respuestas.
- Contratos reales con nube de pruebas y usuario autorizado. No declarar integración terminada solo con mocks.
- Regresión de documentos, clientes y asistencia sin datos productivos.

## Entrega e instalación

Entregar en MD-agente/ENTREGA_LMS_LOCAL_<fecha>.md: archivos nuevos/modificados, contratos acordados y pendientes, SQL, hashes, comandos exactos ejecutados, pruebas reales vs simuladas, dependencias, permisos, backups, despliegue y reversión.

No ejecutar producción hasta revisión y autorización. Desplegar deshabilitado primero. Antes de activar, comprobar API/credenciales de pruebas, migraciones revisadas, respaldo/restauración, worker y monitoreo. Mantener el alcance separado de las correcciones documentales que está realizando Codex.

Primer resultado esperado: contrato M2M y esqueleto Laravel con flag apagada, migraciones solo en base aislada y pruebas del flujo curso → módulo → contenido; no un despliegue productivo apresurado.
