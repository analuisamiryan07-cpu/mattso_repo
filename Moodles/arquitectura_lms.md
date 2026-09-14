# Documento de Arquitectura Técnica: Sistema LMS Multi-Modal (Tradicional y VOD)

## 1. Visión General del Sistema
Desarrollo de una plataforma LMS unificada para educación continua y certificación, capaz de manejar dos enfoques de impartición bajo una misma base de datos y lógica de negocio:
1.  **Enfoque Tradicional:** Asignaciones manuales, subida de tareas, entregables y calificación por intervención humana.
2.  **Enfoque VOD (Estilo Coursera):** Consumo de video secuencial, bloqueo de progreso hasta completar visualización y evaluación automática (Quizzes).

## 2. Stack Tecnológico e Infraestructura
El sistema es distribuido y requiere fronteras de integración rígidas entre sus componentes:

*   **LMS Frontend (Estudiantes):** `React` alojado en `Vercel`. Interfaz dinámica que se adapta al modo del curso.
*   **LMS Backend (Core API):** `NestJS` alojado en `Render`. Único servicio con acceso a la base de datos.
*   **Backoffice (Administración):** `Laravel` (PHP 8.4) alojado en servidor local `Ubuntu Server`.
*   **E-commerce (Existente):** Frontend en `React`, Backend en `NestJS`.
*   **Base de Datos:** `PostgreSQL` alojada en `Supabase`.
*   **Almacenamiento y Streaming de Video:** `Cloudinary`.

---

## 3. Reglas Arquitectónicas Inquebrantables (Core Invariants)
ClaudeCode: **Bajo ninguna circunstancia debes violar estas directrices durante la generación de código.**

1.  **Aislamiento de Base de Datos:** El Backoffice en `Laravel` tiene TERMINANTEMENTE PROHIBIDO conectarse directamente a la base de datos `PostgreSQL` (Supabase). Todas las operaciones de lectura/escritura de los administradores deben realizarse mediante peticiones HTTP a la API de `NestJS`.
2.  **Pipeline de Subida de Video (No Proxy):** `Laravel` no debe enviar archivos de video pesados al backend de `NestJS`. `Laravel` debe comunicarse directamente con la API de `Cloudinary` (Server-to-Server) usando su SDK para subir el archivo MP4, obtener la URL/Metadatos, y posteriormente enviar solo el payload JSON a `NestJS` para registrarlo en la base de datos.
3.  **Reproducción VOD:** El frontend en `React` no debe usar etiquetas `<video>` nativas para el contenido de los cursos. Debe utilizar un reproductor compatible con HLS (ej. `video.js`) consumiendo las URLs optimizadas (.m3u8) generadas por Cloudinary.
4.  **Tracking de Video:** `React` debe enviar *pings* periódicos a `NestJS` informando el `timestamp` del video. `NestJS` debe validar esto asíncronamente. El estudiante no puede acceder al quiz hasta que el servidor marque el video como completado (ej. 95% de visualización).

---

## 4. Diseño del Esquema Relacional (Supabase / PostgreSQL)
El diseño debe ser polimórfico para soportar ambos enfoques. Implementar las siguientes tablas principales a través de migraciones/Prisma o TypeORM en `NestJS`:

*   **`users`**: Extensión de Supabase Auth (Roles: `STUDENT`, `ADMIN`).
*   **`courses`**: 
    *   `id` (UUID, PK)
    *   `title` (Varchar)
    *   `delivery_mode` (Enum: `TRADICIONAL`, `ASINCRONO_VOD`)
    *   `is_active` (Boolean)
*   **`modules`**: Relacionado a `courses` (1:N). Incluye `sequence_order` para desbloqueo lineal.
*   **`content_items`**: Relacionado a `modules` (1:N).
    *   `item_type` (Enum: `VIDEO`, `ASSIGNMENT`, `QUIZ`, `DOCUMENT`)
    *   `cloudinary_url` (Varchar, Nullable)
    *   `assignment_instructions` (Text, Nullable)
*   **`student_progress`**: Tracking de finalización (VOD `timestamp_reached` vs. Tradicional `is_graded`).
*   **`student_submissions`** y **`manual_grades`**: Para el enfoque tradicional.
*   **`quizzes`**, **`quiz_questions`**, y **`quiz_attempts`**: Para el enfoque VOD.

---

## 5. Contratos de Integración y Workflows Críticos

### A. Webhook de Inscripción (E-commerce -> NestJS)
*   **Endpoint:** `POST /api/webhooks/enrollment` (En el backend LMS).
*   **Seguridad:** Validación de firma HMAC usando un secreto compartido.
*   **Lógica:** Buscar usuario por email. Si no existe, crearlo en Supabase Auth. Insertar registro en tabla `enrollments` con el `course_id`.

### B. M2M API (Laravel Backoffice -> NestJS LMS)
*   **Autenticación:** API Key o JWT estático inyectado en variables de entorno.
*   **Endpoints requeridos inicialmente:**
    *   `POST /api/admin/courses` (Crear curso)
    *   `POST /api/admin/modules/content` (Adjuntar contenido, recibiendo el payload de Cloudinary)
    *   `GET /api/admin/submissions/pending` (Obtener tareas para calificar)
    *   `POST /api/admin/submissions/{id}/grade` (Emitir calificación)

### C. Tracking de Video VOD (React -> NestJS)
*   **Endpoint:** `POST /api/progress/video-ping`
*   **Payload:** `{ "content_item_id": "UUID", "current_time": 120.5, "total_duration": 600 }`
*   **Lógica NestJS:** Actualizar el progreso. Si `current_time / total_duration >= 0.95`, marcar el ítem como completado y verificar si se debe habilitar el `quiz` del módulo actual.

## 6. Instrucciones de Inicio para ClaudeCode
1.  Inicializa la estructura del proyecto en `NestJS` implementando TypeORM/Prisma conectado a `Supabase`.
2.  Crea los DTOs y validaciones estrictas para el Webhook de inscripción.
3.  Establece la capa de Guards para separar la autenticación de Estudiantes (Supabase Auth) de las peticiones M2M provenientes del servidor `Laravel`.