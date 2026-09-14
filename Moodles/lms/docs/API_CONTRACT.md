# Contrato de API — LMS

Todas las rutas van bajo `/api/lms`. `Auth` indica el guard real del código,
no una intención — está tomado directo de cada controller.

## Portón del Aula Virtual (sin guard — este endpoint ES el login)

| Método | Ruta | Body | Devuelve |
|---|---|---|---|
| POST | `/api/lms/gate/login` | `{ correo, password }` | `{ access_token, user }` igual que `/api/auth/login`, **pero solo si además tiene una orden pagada** (`Orden.estado='PAGADA'` — cubre PayPal y transferencia aprobada, ver `DECISIONES.md` §9). Si las credenciales son correctas pero no hay orden pagada: `403` con `message: 'SIN_INSCRIPCION'` y **sin token**. |

## Estudiante (`JwtAuthGuard` — mismo JWT que el resto del sitio)

| Método | Ruta | Body | Devuelve |
|---|---|---|---|
| GET | `/api/lms/courses` | — | Cursos donde el usuario tiene `Enrollment`, con `progreso_pct`. |
| GET | `/api/lms/courses/:courseId` | — | Módulos + contenido. `unlocked` es secuencial estricto solo si `delivery_mode='ASINCRONO_VOD'`; en `TRADICIONAL` todo viene `unlocked:true` (acceso abierto, ver `DECISIONES.md` §8). Cada item trae también `grade` (nota real, o `null`) y, si es `ASSIGNMENT`, `entrega_status` (`NO_ENTREGADA`/`PENDIENTE_CALIFICACION`/`CALIFICADA`). 403 si no está inscrito. |
| POST | `/api/lms/progress/video-ping` | `{ content_item_id, current_time, total_duration }` | `{ status, video_seconds_reached, just_completed }`. Ver validaciones anti-trampa en `progress.service.ts`. |
| POST | `/api/lms/content/:contentItemId/mark-read` | — | `{ status }`. Solo contenido `DOCUMENT`. |
| POST | `/api/lms/content/:contentItemId/submissions` | multipart: `archivo` (PDF/DOCX/JPG/PNG, máx 10MB) + `comentario` (opcional, texto) | La `StudentSubmission` creada. Solo contenido `ASSIGNMENT` desbloqueado. |
| GET | `/api/lms/content/:contentItemId/quiz` | — | Preguntas + opciones **sin** `is_correct`, más `attempts_used`/`can_attempt`. |
| POST | `/api/lms/quizzes/:quizId/attempts` | — | El `QuizAttempt` (nuevo o el `IN_PROGRESS` existente). 403 si se agotaron los intentos. |
| POST | `/api/lms/quizzes/attempts/:attemptId/submit` | `{ answers: [{ question_id, selected_option_ids: [] }] }` | `{ score, passed, details: [{question_id, correct}] }`. |
| GET | `/api/lms/access-codes/status` | — | `{ desbloqueado }` — si ya pasó el portón alguna vez (evita volver a pedir la clave). |
| POST | `/api/lms/access-codes/verify` | `{ code }` | Valida la clave de un solo uso que generó el sistema interno. |

## Profesor (`JwtAuthGuard` + `RolesGuard` con `rol=PROFESOR`)

Ownership real, no de interfaz: cada endpoint verifica que el curso/módulo/
entrega sea del profesor autenticado antes de dejarlo tocar nada.

| Método | Ruta | Body | Nota |
|---|---|---|---|
| GET | `/api/lms/professor/courses` | — | Solo cursos con `profesor_usuario_id = req.user.id`. |
| POST | `/api/lms/professor/courses` | `{ titulo, delivery_mode, producto_id?, descripcion? }` | El curso creado queda asignado automáticamente al profesor autenticado. |
| GET | `/api/lms/professor/courses/:courseId` | — | Árbol completo, solo si es dueño. |
| POST | `/api/lms/professor/courses/:courseId/modules` | `{ titulo, sequence_order }` | |
| POST | `/api/lms/professor/modules/:moduleId/content` | Igual que el DTO admin | Sin selector de archivo todavía — la URL de Cloudinary se pega a mano (ver `DECISIONES.md` §9). |
| POST | `/api/lms/professor/content/:contentItemId/quiz` | Igual que el DTO admin | |
| GET | `/api/lms/professor/submissions/pending` | — | Solo entregas de cursos propios. |
| POST | `/api/lms/professor/submissions/:submissionId/grade` | `{ score, feedback? }` | `graded_by_usuario_id` sale del JWT — a diferencia del endpoint M2M, aquí nunca viaja en el body. |

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
| POST | `/api/lms/admin/access-codes` | `{ usuario_id }` | Genera la clave del portón y la manda por Brevo. Devuelve `{ code, expires_at }` también en la respuesta (para reenviar por WhatsApp si aplica). |
| DELETE | `/api/lms/admin/access-codes/:usuarioId` | — | Revoca una clave sin usar. |
| POST | `/api/lms/admin/professors` | `{ correo, cliente_id? }` | Crea o asciende un `UsuarioWeb` a `rol=PROFESOR`. Si es cuenta nueva, dispara el flujo de "olvidé mi contraseña" para que la defina. |
| PATCH | `/api/lms/admin/professors/:usuarioId` | `{ activo: boolean }` | Desactiva/reactiva sin borrar su historial de cursos. |

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
