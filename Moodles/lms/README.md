# LMS MATSSO — documentación (el código real ya no está aquí)

Implementación del sistema descrito en `Moodles/arquitectura_lms_nube.md`
("trabajo en la nube": frontend React + API NestJS + PostgreSQL de Supabase,
nada en el servidor local — separado a propósito de `proyecto_matt`,
`Gestión_horas_MATSSO` y el resto del back-office, que sí viven en el servidor
Ubuntu).

**Empieza por `docs/QUE_NECESITO_DE_TI.md`** si lo que buscas es la lista de
pasos pendientes (variables de entorno, SQL, subdominio, git).

**El código ya se movió a su ubicación real:**

- Backend: `backend-matsso/src/lms/`
- Frontend estudiante/profesor: proyecto separado `aula-virtual/` (dominio y
  deploy aparte del sitio público — ver `aula-virtual/README.md`)

**`backend/` y `frontend/` ya no existen en esta carpeta** — eran una copia
de referencia desactualizada del primer borrador y se borraron (confirmado
con el usuario) porque no reflejaban el diseño real. El código real siempre
está en `backend-matsso/src/lms/` y `aula-virtual/`.

**Rama:** este trabajo vive en la rama local `lms/aula-virtual`, creada a
partir de `origin/main` real (no de la rama `main` local, que tiene un
historial roto y desconectado — ver la auditoría previa del proyecto). No se
ha hecho `git push` todavía — ver `docs/QUE_NECESITO_DE_TI.md` punto 6.

## Qué existe hoy

**Ya estaba construido antes de este trabajo:** el modelo de datos base —
`backend-matsso/prisma/schema.prisma`, schema `lms` (`Course`, `Module`,
`ContentItem`, `Enrollment`, `StudentProgress`, `StudentSubmission`,
`ManualGrade`, `Quiz` y toda la cadena de preguntas/opciones/intentos).

**Agregado en este trabajo** (schema + backend NestJS + frontend React,
verificado compilando y arrancando de verdad — ver `docs/INTEGRACION.md` §1 —
pero sin tests automatizados todavía):

- `Course.profesor_usuario_id` (dueño del curso) y el modelo `AccessCode`
  (clave de acceso de un solo uso). SQL real en `db_scripts/11_lms_schema.sql`.
- Portón de entrada al Aula Virtual: login + validación de que la cuenta
  tenga una orden pagada (`/api/lms/gate/login`), clave de acceso generada
  por el sistema interno (`/api/lms/access-codes/*`).
- API del profesor (JWT + rol, ownership real verificado en servidor): crear
  sus cursos, módulos y contenido, calificar solo sus propias entregas.
- API M2M para el sistema interno: crear/gestionar profesores
  (`/api/lms/admin/professors`) y claves de acceso, además de lo que ya
  existía (cursos/contenido/quizzes/entregas a nivel global).
- API del estudiante: listar mis cursos, ver curso con desbloqueo — **secuencial
  solo en cursos `ASINCRONO_VOD`; abierto en `TRADICIONAL`**, con nota real y
  estado de entrega por actividad.
- Frontend `aula-virtual/`: portón de 2 pasos, `MisCursos`, `CursoVOD` (look
  Coursera), `CursoTradicional` (look Moodle), `MisCursosProfesor` +
  `CursoProfesor` (crear curso, módulos, contenido, calificar).

## Estructura de esta carpeta

```
Moodles/lms/
├── README.md              (este archivo)
└── docs/
    ├── QUE_NECESITO_DE_TI.md           checklist de lo que falta, para el usuario
    ├── REQUISITOS_SISTEMA_INTERNO.md   qué necesita llamar el sistema interno (Laravel), con código PHP listo
    ├── API_CONTRACT.md                 referencia de cada endpoint
    ├── DECISIONES.md                    dónde se desvía de arquitectura_lms_nube.md y por qué
    └── INTEGRACION.md                   estado técnico real: qué está verificado y qué falta
```

## Qué falta (ver `docs/QUE_NECESITO_DE_TI.md` para el checklist accionable)

- Correr `db_scripts/11_lms_schema.sql` en Supabase — sin esto nada funciona.
- Variables de entorno nuevas en Render/Vercel.
- Subdominio real en Cloudflare para `aula-virtual`.
- `git push` — nada subido a GitHub todavía.
- No hay ningún curso creado — la capacidad existe, el contenido no.
- Sin tests automatizados ni Swagger.
- El webhook de inscripción existe pero nada lo llama todavía.
- Selector de subida de archivos para el profesor (hoy es una URL pegada a
  mano) y compra corporativa (`cantidad > 1`) quedan fuera a propósito.
