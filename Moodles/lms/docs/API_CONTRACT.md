# Contrato de API — LMS

Todas las rutas van bajo `/api/lms`. `Auth` indica el guard real del código,
no una intención — está tomado directo de cada controller.

## Estudiante (`JwtAuthGuard` — mismo JWT que el resto del sitio)

| Método | Ruta | Body | Devuelve |
|---|---|---|---|
| GET | `/api/lms/courses` | — | Cursos donde el usuario tiene `Enrollment`, con `progreso_pct`. |
| GET | `/api/lms/courses/:courseId` | — | Módulos + contenido con `unlocked`/`status` calculados en servidor. 403 si no está inscrito. |
| POST | `/api/lms/progress/video-ping` | `{ content_item_id, current_time, total_duration }` | `{ status, video_seconds_reached, just_completed }`. Ver validaciones anti-trampa en `progress.service.ts`. |
| POST | `/api/lms/content/:contentItemId/mark-read` | — | `{ status }`. Solo contenido `DOCUMENT`. |
| POST | `/api/lms/content/:contentItemId/submissions` | multipart: `archivo` (PDF/DOCX/JPG/PNG, máx 10MB) + `comentario` (opcional, texto) | La `StudentSubmission` creada. Solo contenido `ASSIGNMENT` desbloqueado. |
| GET | `/api/lms/content/:contentItemId/quiz` | — | Preguntas + opciones **sin** `is_correct`, más `attempts_used`/`can_attempt`. |
| POST | `/api/lms/quizzes/:quizId/attempts` | — | El `QuizAttempt` (nuevo o el `IN_PROGRESS` existente). 403 si se agotaron los intentos. |
| POST | `/api/lms/quizzes/attempts/:attemptId/submit` | `{ answers: [{ question_id, selected_option_ids: [] }] }` | `{ score, passed, details: [{question_id, correct}] }`. |

## Admin / M2M desde Laravel (`LmsM2mGuard` — header `x-lms-m2m-key`)

Header opcional `x-lms-m2m-actor` (texto libre) para trazabilidad en logs.

| Método | Ruta | Body | Nota |
|---|---|---|---|
| GET | `/api/lms/admin/courses` | — | Lista con conteo de módulos/inscritos. |
| GET | `/api/lms/admin/courses/:courseId` | — | Árbol completo (módulos, contenido, quiz **con** respuestas — solo para admin). |
| POST | `/api/lms/admin/courses` | `{ producto_id?, titulo, descripcion?, delivery_mode, is_active? }` | |
| PATCH | `/api/lms/admin/courses/:courseId` | `{ titulo?, descripcion?, is_active? }` | |
| POST | `/api/lms/admin/courses/:courseId/modules` | `{ titulo, sequence_order }` | `sequence_order` debe ser único por curso. |
| POST | `/api/lms/admin/modules/:moduleId/content` | Ver `create-content-item.dto.ts` | Para `VIDEO`: Laravel ya subió el archivo a Cloudinary directo (regla de arquitectura) — aquí solo se registra `cloudinary_public_id`/`cloudinary_url`/`video_duration_seconds`. |
| POST | `/api/lms/admin/content/:contentItemId/quiz` | Ver `create-quiz.dto.ts` | El `content_item` debe existir con `item_type=QUIZ` antes de llamar esto. |
| GET | `/api/lms/admin/submissions/pending` | — | Entregas sin calificar, con curso/módulo/estudiante. |
| POST | `/api/lms/admin/submissions/:submissionId/grade` | `{ graded_by_usuario_id, score, feedback? }` | `graded_by_usuario_id` es el id de `UsuarioWeb` del admin — ver `DECISIONES.md` §3. |

## Webhook (firma HMAC, sin JWT ni x-admin-key)

| Método | Ruta | Headers | Body |
|---|---|---|---|
| POST | `/api/lms/webhooks/enrollment` | `x-webhook-timestamp` (unix ms), `x-webhook-signature` (hex HMAC-SHA256 de `${timestamp}.${rawBody}` con `LMS_ENROLLMENT_WEBHOOK_SECRET`) | `{ event_id, usuario_id, producto_id, orden_item_id?, source? }` |

Ver `INTEGRACION.md` punto 4 sobre por qué el llamador real recomendado es
interno (llamada directa a `EnrollmentService`), no este endpoint HTTP.

## Errores comunes

Todos los endpoints devuelven el formato estándar de NestJS
(`{ statusCode, message, error }`). Casos específicos de este módulo:

- `403 Forbidden` con "No estás inscrito en este curso." — el estudiante pidió
  un curso sin `Enrollment`.
- `403 Forbidden` con "Este contenido todavía no está desbloqueado." — se
  intentó acceder a progreso/entrega/quiz de un content_item bloqueado por
  secuencia.
- `400 Bad Request` con "La duración reportada no coincide..." — el ping de
  video reporta un `total_duration` que no coincide con el video registrado
  (posible manipulación del cliente o contenido mal configurado por el admin).
