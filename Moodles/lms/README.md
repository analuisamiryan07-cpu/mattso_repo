# LMS MATSSO — desarrollo en curso

Implementación del sistema descrito en `Moodles/arquitectura_lms_nube.md`
("trabajo en la nube": frontend React + API NestJS + PostgreSQL de Supabase,
nada en el servidor local — separado a propósito de `proyecto_matt`,
`Gestión_horas_MATSSO` y el resto del back-office, que sí viven en el servidor
Ubuntu).

**Por qué está todo aquí y no ya en `backend-matsso/src` o `src/`:** este
checkout tiene un problema de historial de Git conocido (la rama `main` local
no comparte historia con `origin/main` — ver la auditoría previa del
proyecto). Mientras eso no se resuelva, este trabajo se mantiene aislado en
una carpeta propia para poder revisarlo, probarlo y decidir cómo reconciliarlo
sin arriesgar el código que ya corre en producción. `Moodles/lms/docs/INTEGRACION.md`
tiene los pasos exactos para moverlo cuando esté listo.

## Qué existe hoy

**Ya estaba construido antes de esta pasada:** el modelo de datos completo —
`backend-matsso/prisma/schema.prisma`, schema `lms` (`Course`, `Module`,
`ContentItem`, `Enrollment`, `StudentProgress`, `StudentSubmission`,
`ManualGrade`, `Quiz` y toda la cadena de preguntas/opciones/intentos). No se
tocó ese archivo — todo lo de aquí se escribió para calzar exacto con los
nombres de campo que ya tiene.

**Construido en esta pasada** (backend NestJS + frontend React funcionales,
sin tests automatizados todavía):

- Inscripción desde e-commerce: webhook HMAC + service idempotente.
- API M2M para Laravel: crear cursos/módulos/contenido/quizzes, listar y
  calificar entregas pendientes.
- API del estudiante: listar mis cursos, ver curso con desbloqueo secuencial
  calculado en servidor, ping de progreso de video con validación anti-trampa,
  entrega de tareas, tomar y calificar cuestionarios (auto-calificación
  server-side, nunca confía en el cliente).
- Frontend: página "Mis cursos", detalle de curso con navegación por
  módulos/contenido bloqueado-desbloqueado, reproductor HLS (video.js) con
  envío de progreso, componente de cuestionario, componente de entrega de
  tareas.

## Estructura

```
Moodles/lms/
├── README.md              (este archivo)
├── backend/                → destino final: backend-matsso/src/lms/
│   ├── lms.module.ts
│   ├── common/              guard M2M + utilidad HMAC
│   ├── enrollment/          webhook de inscripción
│   ├── courses/             lado estudiante + lado admin/M2M
│   ├── progress/            ping de video + documentos leídos
│   ├── submissions/         entregas de tareas + calificación
│   └── quizzes/             cuestionarios + auto-calificación
├── frontend/                → destino final: src/{api,pages/lms,components/lms}/
│   ├── api/lmsService.js
│   ├── pages/                MisCursos, CursoDetalle
│   └── components/           VideoPlayer, QuizRunner, EntregaTarea
└── docs/
    ├── API_CONTRACT.md      referencia rápida de cada endpoint
    ├── DECISIONES.md         dónde se desvía de arquitectura_lms_nube.md y por qué
    └── INTEGRACION.md        pasos exactos para mover esto al resto del repo
```

## Qué falta (no es "terminado", es el estado real)

Ver `docs/INTEGRACION.md` §8 para la lista completa. Los puntos grandes:

- No hay ningún curso creado todavía — esto es la capacidad de crearlos y
  cursarlos, no contenido real cargado.
- Sin tests de integración ni de contrato con Laravel (criterio §8 de
  `arquitectura_lms_nube.md`).
- Sin OpenAPI/Swagger generado.
- El webhook de inscripción existe pero nada lo llama todavía — hace falta
  conectar el flujo de aprobación de orden (`INTEGRACION.md` punto 4).
- Compra corporativa (`cantidad > 1`) no resuelta — es decisión de producto,
  no solo técnica (`DECISIONES.md` §4).
