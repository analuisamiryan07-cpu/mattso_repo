# Aula Virtual (LMS Moodle / Coursera) — Avance y análisis al 20/10/2026

Dominio: `aula.sapper-industries.com`
**Inicio:** lun 01/09/26 · **Último avance:** mar 20/10/26

> **Aclaración:** el proyecto **no** usa una instalación del producto Moodle. Es un
> LMS propio. El Aula Virtual es un frontend React que imita dos estilos: **Moodle**
> (modalidad `TRADICIONAL`) y **Coursera** (modalidad `ASINCRONO_VOD`). La carpeta
> `moodle/` es una copia del sistema interno Laravel con el módulo de
> administración del LMS añadido.

**Cómo leer las fechas:**
- Las horas son las de cada commit de git, o sea, cuando se guardó el trabajo.
- Las marcadas con **(est.)** son estimadas: varios commits se guardaron a la misma
  hora, así que el trabajo se hizo en los días anteriores.
- La duración está en días laborables, de lunes a viernes.

---

## 1. Cronograma de lo realizado

### Fase 1 – Seguridad base y diseño de arquitectura

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 1.1 | Despliegue y verificación de las correcciones de seguridad (catálogo y órdenes) | mar 01/09/26 | mar 01/09/26 | 1 d |
| 1.2 | Guía de pruebas de seguridad y colección Postman | mié 02/09/26 (est.) | jue 03/09/26 | 2 d |
| 1.3 | Revisión de seguridad del e-commerce y el LMS, con su respuesta | jue 03/09/26 | jue 03/09/26 | 1 d |
| 1.4 | Documentos de arquitectura del LMS (`arquitectura_lms.md`, `arquitectura_lms_nube.md`) | lun 07/09/26 (est.) | mié 09/09/26 | 3 d |
| 1.5 | Modelo de datos `lms` en Prisma (cursos, módulos, contenido, inscripciones, progreso, entregas, quizzes) | jue 10/09/26 | jue 10/09/26 | 1 d |

### Fase 2 – Backend del LMS y Aula Virtual v1

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 2.1 | Portón de acceso, roles de profesor y estudiante, módulo LMS en NestJS | vie 11/09/26 (est.) | lun 14/09/26 08:30 | 2 d |
| 2.2 | Aula Virtual como proyecto y dominio aparte, portón de pago (orden PAGADA), separación Moodle/Coursera (CursoTradicional / CursoVOD) | lun 14/09/26 | lun 14/09/26 10:03 | 1 d |
| 2.3 | Coursera: desbloqueo en orden y control contra adelantar videos; Moodle: acceso libre | lun 14/09/26 | lun 14/09/26 | 1 d |
| 2.4 | Corrección de 2 errores de compilación y `package-lock` del aula | lun 14/09/26 | lun 14/09/26 10:17 | 1 d |
| 2.5 | Endpoints de gestión de profesores (M2M con Laravel) | lun 14/09/26 | lun 14/09/26 10:21 | 1 d |
| 2.6 | Script SQL `11_lms_schema.sql` | lun 14/09/26 | lun 14/09/26 | 1 d |
| 2.7 | Documentación: checklist, requisitos del sistema interno con código PHP, contrato de API, decisiones | lun 14/09/26 | lun 14/09/26 11:57 | 1 d |
| 2.8 | Limpieza de las copias obsoletas `Moodles/lms/backend` y `frontend` | lun 14/09/26 | lun 14/09/26 10:37 | 1 d |
| 2.9 | ◆ **Hito:** PR #1 fusionado en main | lun 14/09/26 11:18 | — | 0 d |
| 2.10 | Inscripción automática conectada a los 3 flujos de pago (transferencia, captura PayPal, webhook PayPal) | lun 14/09/26 | lun 14/09/26 11:55 | 1 d |

### Fase 3 – Cursos duales y claves por compra

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 3.1 | Cursos con modalidad doble Moodle/Coursera y clave de acceso por compra (`access_grants`) | mar 15/09/26 (est.) | mar 22/09/26 16:04 | 6 d |
| 3.2 | "Añadir curso" reemplaza al portón de clave única | mar 15/09/26 (est.) | mar 22/09/26 | 6 d |
| 3.3 | Catálogo público de Cursos en el sitio web | mar 15/09/26 (est.) | mar 22/09/26 | 6 d |
| 3.4 | Laravel: módulo Cursos y "Crear orden de compra" | mar 15/09/26 (est.) | mar 22/09/26 | 6 d |
| 3.5 | Encargo para el colega: administración del LMS en el servidor local | lun 21/09/26 | lun 21/09/26 | 1 d |
| 3.6 | Script SQL `12_lms_cursos_dual.sql` | mar 22/09/26 | mar 22/09/26 | 1 d |
| 3.7 | ◆ **Hito:** PR #2 fusionado | mar 22/09/26 16:13 | — | 0 d |

### Fase 4 – Profesores y creación de cursos

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 4.1 | Profesores para Moodle y contenido de tipo documento/texto (PR #3) | mié 23/09/26 (est.) | jue 24/09/26 14:36 | 2 d |
| 4.2 | Un solo formulario para crear curso: profesor y módulos Coursera (PR #4) | jue 24/09/26 | jue 24/09/26 14:56 | 1 d |
| 4.3 | Corrección: las 3 partes del formulario siempre visibles (PR #5) | jue 24/09/26 | jue 24/09/26 15:21 | 1 d |

### Fase 5 – Gestión de claves en Laravel

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 5.1 | Corrección: "Generar clave" ya no da error al entrar sin buscar (PR #6) | vie 25/09/26 | vie 25/09/26 17:01 | 1 d |
| 5.2 | Historial de claves y opción de reenviar en vez de bloquear (PR #7) | vie 25/09/26 | vie 25/09/26 17:22 | 1 d |
| 5.3 | La clave pasa a ser un código de 10 dígitos (PR #8) | vie 25/09/26 | vie 25/09/26 17:59 | 1 d |
| 5.4 | ◆ **Hito:** PR #8 fusionado (último que está en GitHub) | vie 25/09/26 18:01 | — | 0 d |

### Fase 6 – Ajustes de sesión y del panel de claves

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 6.1 | Sesión deslizante (30 min sin actividad), la clave vence a los 2 días, términos solo una vez | mar 06/10/26 (est.) | lun 19/10/26 08:52 | 10 d |
| 6.2 | Historial visible sin buscar y quitar la casilla de términos | lun 19/10/26 | lun 19/10/26 09:53 | 1 d |
| 6.3 | Reordenar el panel de claves, mostrar el correo en el historial, botón de copiar | lun 19/10/26 | lun 19/10/26 10:03 | 1 d |
| 6.4 | Quitar el botón de ver clave y dejar solo copiar | lun 19/10/26 | lun 19/10/26 10:18 | 1 d |
| 6.5 | Ícono de copiar en SVG | lun 19/10/26 | lun 19/10/26 10:26 | 1 d |

### Fase 7 – Rediseño visual, fase 1

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 7.1 | Panel General y Área Personal (bloques Moodle/Coursera, 4 tarjetas de resumen) | lun 19/10/26 | lun 19/10/26 11:15 | 1 d |
| 7.2 | Footer completo (dirección y contacto) y botón de añadir curso | lun 19/10/26 | lun 19/10/26 11:34 | 1 d |
| 7.3 | Seguridad: si falla la verificación de cursos, se cierra la sesión | lun 19/10/26 | lun 19/10/26 11:39 | 1 d |

### Fase 8 – Rediseño visual, fase 2 (interfaces de Moodle)

| Id | Tarea | Comienzo | Fin | Dur. |
|---|---|---|---|---|
| 8.1 | "Ingresa tu clave": salida explícita y límite de 5 min | mar 20/10/26 | mar 20/10/26 12:51 | 1 d |
| 8.2 | Interfaces de Moodle: Área Personal, Mis Cursos, línea de tiempo, mensajería con el profesor, notificaciones | mar 20/10/26 | mar 20/10/26 14:47 | 1 d |
| 8.3 | Script SQL `13_lms_mensajeria_notificaciones.sql` | mar 20/10/26 | mar 20/10/26 | 1 d |
| 8.4 | Notificaciones y mensajes en pantalla completa, selector de idioma, calendario con eventos propios (`personal_events`), `.ics`, footer de Moodle | mar 20/10/26 | mar 20/10/26 15:25 | 1 d |
| 8.5 | Revisión y análisis técnico del módulo LMS | mar 20/10/26 | mar 20/10/26 | 1 d |

### Resumen del avance

- **Periodo:** del 01/09/26 al 20/10/26, con 11 días de trabajo efectivo según git.
  Del 26/09 al 05/10 no hay commits del LMS; el 06/10 solo hay un respaldo (stash).
- **En GitHub (main):** todo lo hecho hasta el **25/09/26** (PR #1 al #8).
- **Solo en el equipo local, sin subir:** los **11 commits del 19/10 y el 20/10**
  (fases 6, 7 y 8).
- **Scripts SQL:** el commit del `13_lms_mensajeria_notificaciones.sql` (con
  `personal_events`) dice que aún no se ha corrido. No se pudo comprobar si el `11`
  y el `12` ya se corrieron en Supabase.

---

## 2. Análisis técnico

### 2.1 Componentes

| Pieza | Ubicación | Qué es |
|---|---|---|
| Aula Virtual (frontend) | `aula-virtual/` | React/Vite. Se despliega por separado en Vercel (Root Directory = `aula-virtual`); el subdominio `aula` se apunta con un CNAME desde Cloudflare. |
| API del LMS | `backend-matsso/src/lms/` | Módulo NestJS dentro del mismo backend del sitio público (Render). Expone unos 45 endpoints bajo `/api/lms/*`. |
| Base de datos | `backend-matsso/prisma/schema.prisma` (schema `lms`) y `db_scripts/11`, `12`, `13` | Supabase PostgreSQL: Course, Module, ContentItem, Enrollment, StudentProgress, StudentSubmission, Quiz…, AccessGrant, Conversation, Message, Notification, personal_events. |
| Administración (Laravel) | `moodle/` (`CursosController`, `ProfesoresController`, `LmsApiService`) | Pantallas `/admin/cursos`, `/admin/profesores` y `/admin/cursos/claves`. Llaman a NestJS con el header `x-lms-m2m-key`. |
| Enlace desde el sitio público | `src/components/layout/Header.jsx`, `src/pages/CursoDetail.jsx` | El botón "Aula Virtual" usa `VITE_AULA_VIRTUAL_URL`, con `https://aula.sapper-industries.com` por defecto. |
| Documentación | `Moodles/lms/docs/` y `Moodles/mds/` | Arquitectura, contrato de la API, decisiones, checklist y revisiones de seguridad. |

### 2.2 Recorrido de un estudiante

1. Compra un producto de tipo CURSO. Cuando la orden pasa a `PAGADA`, se inscribe
   automáticamente en el curso. Esto ya está conectado en tres puntos: aprobación de
   transferencia, captura de PayPal y webhook de PayPal.
2. Un administrador genera la clave en Laravel. Es un código de 10 dígitos por
   compra y llega por correo (Brevo). Si nadie lo canjea en 2 días, se revoca solo.
3. Login en el aula (`/api/lms/gate/login`): pide credenciales correctas y al menos
   una orden pagada.
4. Si todavía no tiene ningún curso vigente, ve "Ingresa tu clave". Al canjear, el
   acceso dura `duracion_meses` contados desde ese momento.
5. Panel General con bloques Moodle y Coursera:
   - **Moodle** (`TRADICIONAL`): acceso libre a todos los recursos, línea de tiempo,
     calendario con exportación `.ics`, mensajería con el profesor y notificaciones.
   - **Coursera** (`ASINCRONO_VOD`): los módulos se desbloquean en orden y hay
     controles contra adelantar el video.
6. El rol `PROFESOR` crea cursos, módulos, contenido y quizzes, y califica las
   entregas de sus propios cursos. Hoy pega a mano la URL de Cloudinary, porque no
   hay selector de archivos.

Un mismo curso puede ofrecer las dos modalidades a la vez (`modo_moodle` /
`modo_coursera`), y cada módulo lleva su propia modalidad.

### 2.3 Problemas encontrados

**Funcionales**
- **Probable bloqueo de profesores:** `lms-gate.service.ts` exige una orden `PAGADA`
  a cualquier cuenta, sin excepción para el rol `PROFESOR`. Un profesor creado desde
  Laravel que nunca compró nada no podría entrar al aula. No se probó en ejecución,
  pero el código no tiene ninguna excepción.
- **Sin `LMS_CLAVE_JWT_SECRET` no se generan claves:** `generar()` firma un JWT cuyo
  resultado no se usa, pero la firma falla si falta esa variable en Render.
- **Compra corporativa (`cantidad > 1`) sin resolver:** solo se inscribe a una
  persona por cada ítem de la orden.
- **Sin tests automatizados** del LMS, tanto en NestJS como en Laravel, y no hay
  Swagger.

**Seguridad (riesgo bajo/medio)**
- El portón es esquivable: el JWT de `/api/auth/login` del sitio público es el
  mismo, y los endpoints `/api/lms/*` solo usan `JwtAuthGuard`. El impacto es
  limitado, porque ver un curso además exige una clave canjeada y una inscripción.
- `lms-m2m.guard.ts` compara la clave con `!==`, que no es una comparación de tiempo
  constante.
- La sesión (el token) se guarda en `localStorage`.
- Las claves se guardan en texto plano. Es intencional, para poder reenviarlas
  desde el panel.

### 2.4 Documentación desactualizada respecto al código

- `API_CONTRACT.md` y `aula-virtual/README.md` describen `/access-codes/*` y
  `Clave.jsx`, que ya no existen (ahora son `access-grants` e `IngresarClave.jsx`).
  Tampoco aparecen mensajería, notificaciones, calendario, `resumen`,
  `linea-de-tiempo`, el dashboard del admin, las imágenes ni la asignación de
  profesor, y siguen usando `delivery_mode` único en lugar del modelo dual.
- `INTEGRACION.md` §5 dice que la inscripción automática "sigue sin conectarse",
  pero ya está conectada desde el 14/09/26.
- `QUE_NECESITO_DE_TI.md` §6 dice que no se ha subido nada a GitHub; en realidad
  los PR #1 al #8 ya están fusionados en `main`.
- `ENCARGO_LMS_LOCAL_COLEGA_2026-09-21.md` propone otra arquitectura para Laravel
  (`config/lms.php`, `LMS_ENABLED`, tablas `lms_sync_operations` y `lms_uploads`,
  colas). Lo construido en `moodle/` es más simple: llamadas directas con
  `config/matsso.php`, sin bandera de activación ni idempotencia. Además, ese
  documento cita `arquitectura_lms_local.md`, que no existe en el repo.
- Los `.md` de `Moodles/` se movieron a `Moodles/mds/` sin commitear.

### 2.5 Despliegue

- El módulo de administración del LMS (`CursosController`, `ProfesoresController`,
  `LmsApiService`) solo está en `moodle/`. **No está en `proyecto_matt_SERVIDOR/`**,
  la copia del servidor, así que probablemente todavía no esté en producción.
- No se pudo verificar si `aula.sapper-industries.com` ya resuelve.
- Los scripts SQL deben correrse en orden: `11` → `12` → `13`. El `12` elimina
  `access_codes` y crea `access_grants`.

---

## 3. Próximos pasos recomendados

1. Dejar pasar el rol `PROFESOR` en el portón sin exigir una orden pagada.
2. Confirmar que `LMS_CLAVE_JWT_SECRET` y `LMS_M2M_API_KEY` estén en Render, y que
   la segunda coincida con la del Laravel.
3. Correr `13_lms_mensajeria_notificaciones.sql` en Supabase.
4. Subir a GitHub los 11 commits del 19 y 20/10 y commitear el movimiento a
   `Moodles/mds/`.
5. Actualizar `API_CONTRACT.md`, `aula-virtual/README.md` e `INTEGRACION.md`.
6. Decidir con el colega si Laravel sigue el esquema simple ya construido o el del
   encargo del 21/09.
