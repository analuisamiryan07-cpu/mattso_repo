# LMS MATSSO — documentación (el código real ya no está aquí)

Implementación del sistema descrito en `Moodles/arquitectura_lms_nube.md`
("trabajo en la nube": frontend React + API NestJS + PostgreSQL de Supabase,
nada en el servidor local — separado a propósito de `proyecto_matt`,
`Gestión_horas_MATSSO` y el resto del back-office, que sí viven en el servidor
Ubuntu).

**El código ya se movió a su ubicación real:**

- Backend: `backend-matsso/src/lms/`
- Frontend estudiante/profesor: proyecto separado `aula-virtual/` (dominio y
  deploy aparte del sitio público — ver `aula-virtual/README.md`)
- `backend/` y `frontend/` en esta carpeta son una **copia de referencia**
  de cómo quedó estructurado, no la fuente de verdad. Si difieren, el código
  real gana.

**Rama:** este trabajo vive en la rama local `lms/aula-virtual`, creada a
partir de `origin/main` real (no de la rama `main` local, que tiene un
historial roto y desconectado — ver la auditoría previa del proyecto). No se
ha hecho `git push` todavía.

## Qué existe hoy

**Ya estaba construido antes de este trabajo:** el modelo de datos base —
`backend-matsso/prisma/schema.prisma`, schema `lms` (`Course`, `Module`,
`ContentItem`, `Enrollment`, `StudentProgress`, `StudentSubmission`,
`ManualGrade`, `Quiz` y toda la cadena de preguntas/opciones/intentos).

**Agregado en este trabajo** (schema + backend NestJS + frontend React
funcionales, sin tests automatizados todavía):

- `Course.profesor_usuario_id` (dueño del curso) y el modelo `AccessCode`
  (clave de acceso de un solo uso).
- Portón de entrada al Aula Virtual: login + validación de que la cuenta
  tenga una orden pagada (`/api/lms/gate/login`), clave de acceso generada
  por el sistema interno (`/api/lms/access-codes/*`).
- API del profesor (JWT + rol, ownership real verificado en servidor): crear
  sus cursos, módulos y contenido, calificar solo sus propias entregas.
- API M2M para el sistema interno: crear/gestionar profesores y claves de
  acceso, además de lo que ya existía (cursos/contenido/quizzes/entregas a
  nivel global).
- API del estudiante: listar mis cursos, ver curso con desbloqueo — **secuencial
  solo en cursos `ASINCRONO_VOD`; abierto en `TRADICIONAL`**, con nota real y
  estado de entrega por actividad.
- Frontend `aula-virtual/`: portón de 2 pasos, `MisCursos`, `CursoVOD` (look
  Coursera), `CursoTradicional` (look Moodle), `MisCursosProfesor` +
  `CursoProfesor` (crear curso, módulos, contenido, calificar).

## Estructura de esta carpeta (solo documentación + copia de referencia)

```
Moodles/lms/
├── README.md              (este archivo)
├── backend/                 copia de referencia de backend-matsso/src/lms/
├── frontend/                copia de referencia del primer borrador (antes de separar Moodle/Coursera)
└── docs/
    ├── API_CONTRACT.md               referencia de cada endpoint
    ├── DECISIONES.md                  dónde se desvía de arquitectura_lms_nube.md y por qué
    ├── INTEGRACION.md                 estado real: qué falta para que funcione en producción
    └── REQUISITOS_SISTEMA_INTERNO.md  qué necesita llamar el sistema interno (Laravel)
```

## Qué falta (ver `docs/INTEGRACION.md` para el detalle completo)

- Nadie corrió `npm install`/`npm run build` todavía — no hay Node en el
  entorno donde se escribió este código.
- Sin subdominio real configurado en Cloudflare todavía.
- No hay ningún curso creado — la capacidad existe, el contenido no.
- Sin tests automatizados ni Swagger.
- El webhook de inscripción existe pero nada lo llama todavía.
- Selector de subida de archivos para el profesor (hoy es una URL pegada a
  mano) y compra corporativa (`cantidad > 1`) quedan fuera a propósito.
