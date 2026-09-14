# Arquitectura LMS — trabajo en la nube

## 1. Alcance y propietario

Este documento define exclusivamente la plataforma LMS desplegada en la nube: frontend React, API NestJS, PostgreSQL de Supabase, integración de inscripciones del e-commerce y reproducción de contenido alojado en Cloudinary.

No incluye PostgreSQL local, asistencia, generación documental ni la lógica interna del back-office Laravel.

## 2. Componentes

- Frontend LMS React desplegado en Vercel.
- API central NestJS desplegada en Render.
- PostgreSQL y autenticación alojados en Supabase.
- Cloudinary como origen de video y transformación HLS.
- E-commerce existente como emisor de eventos de inscripción.

NestJS es el único servicio autorizado para acceder a las tablas de Supabase. React, Laravel y el e-commerce se integran exclusivamente mediante APIs protegidas.

## 3. Modalidades funcionales

- `TRADICIONAL`: asignaciones, entregas y calificación humana.
- `ASINCRONO_VOD`: contenido secuencial, control de progreso y cuestionarios automáticos.

Ambas modalidades comparten usuarios, cursos, módulos, inscripciones y reglas de autorización, pero sus requisitos de progreso y evaluación son diferentes.

## 4. Modelo de datos objetivo

El esquema debe definirse mediante migraciones administradas por NestJS e incluir, como mínimo:

- `users`: identidad vinculada a Supabase Auth y roles como `STUDENT` y `ADMIN`.
- `courses`: título, modalidad de entrega y estado.
- `modules`: curso, orden y reglas de desbloqueo.
- `content_items`: módulo, tipo (`VIDEO`, `ASSIGNMENT`, `QUIZ`, `DOCUMENT`) y metadatos del contenido.
- `enrollments`: relación entre estudiante y curso, origen y estado.
- `student_progress`: avance validado por contenido.
- `student_submissions` y `manual_grades`: flujo tradicional.
- `quizzes`, `quiz_questions` y `quiz_attempts`: flujo evaluativo VOD.

Todas las claves públicas deben ser UUID. Deben existir restricciones, índices, políticas de acceso y trazabilidad temporal explícitas.

## 5. API y workflows

### Inscripción desde e-commerce

- Endpoint objetivo: `POST /api/webhooks/enrollment`.
- Verificar firma HMAC, marca temporal y protección contra repetición.
- Procesar con una clave idempotente propia de la orden/evento.
- Resolver la identidad del usuario de forma controlada y registrar la inscripción sin duplicarla.

### Administración desde Laravel

NestJS debe exponer la API M2M descrita en el contrato compartido. Debe separar sus guards M2M de la autenticación de estudiantes y auditar quién originó cada operación.

### Consumo y progreso VOD

- React usa un reproductor HLS probado, por ejemplo `video.js`, con URLs autorizadas de Cloudinary.
- React envía eventos de progreso a `POST /api/progress/video-ping`.
- NestJS no confía ciegamente en `current_time` ni `total_duration`: valida secuencia, saltos anómalos, duración conocida y pertenencia del estudiante.
- El quiz se habilita solo cuando el servidor confirma el umbral de finalización definido, inicialmente 95 %.

## 6. Seguridad de nube

- Autenticación de estudiantes con tokens de corta duración y autorización por recurso.
- Firma HMAC y protección anti-replay para webhooks.
- Credenciales M2M separadas, rotables y con permisos mínimos.
- Rate limiting, validación estricta de DTOs y límites de payload.
- Row Level Security en Supabase como defensa adicional, sin sustituir la autorización de NestJS.
- URLs o tokens de reproducción con el nivel de protección acordado para contenido privado.
- Logs con correlación entre e-commerce, NestJS y Laravel, sin secretos ni PII innecesaria.

## 7. Responsabilidades del frontend React

- Mostrar cursos y contenido únicamente según las autorizaciones devueltas por NestJS.
- Adaptar la interfaz a la modalidad del curso.
- Reproducir HLS y reportar progreso; no decidir por sí mismo que un contenido está completado.
- No acceder directamente a tablas de Supabase ni incluir secretos M2M o de Cloudinary.
- Manejar reintentos de red sin duplicar entregas o intentos de quiz.

## 8. Criterios de terminado de nube

- Migraciones reproducibles y revisadas.
- Webhook de inscripción idempotente y protegido contra repetición.
- Guards separados para estudiantes, administradores y M2M.
- APIs documentadas con OpenAPI y versionadas.
- Flujo tradicional y VOD cubiertos por pruebas de integración y autorización.
- Pruebas de contrato con Laravel aprobadas.
- Monitoreo, respaldo, restauración y reversión documentados.
