# Decisiones y desvíos respecto a `arquitectura_lms_nube.md`

Documento de honestidad técnica: dónde este desarrollo sigue el documento al
pie de la letra, dónde se adaptó a lo que el sistema real ya tiene construido,
y qué se dejó explícitamente fuera.

## 1. No hay Supabase Auth — se reutilizó `UsuarioWeb` + JWT existente

El documento original (§4) describe `users` como "extensión de Supabase Auth".
El sistema real de e-commerce ya tiene su propio login (`UsuarioWeb` con
`password_hash` bcrypt, JWT propio, `JwtAuthGuard`) — y el schema Prisma del
LMS que **ya existe** en `schema.prisma` confirma esto: `Enrollment.usuario_id`
es un `BigInt` que apunta a `UsuarioWeb.id`, no un UUID de Supabase Auth.

Se construyó sobre lo que el schema ya define, no sobre la premisa original
del documento. Esto simplifica el sistema (una sola identidad de estudiante en
vez de dos sincronizadas) y es consistente con cómo ya funciona el checkout.

## 2. El webhook de inscripción es HTTP+HMAC, pero el llamador real es interno

El documento pide un webhook real. Se construyó tal cual (`EnrollmentWebhookController`
+ `hmac.util.ts`), pero la lógica vive separada en `EnrollmentService` para que
el flujo de aprobación de orden (que corre en el mismo proceso NestJS) la
invoque directamente sin pasar por HTTP — ver `INTEGRACION.md` punto 4. El
endpoint HTTP queda disponible para el día que haya un emisor externo real.

## 3. `graded_by_usuario_id` viaja explícito, no se infiere del actor M2M

`ManualGrade.graded_by_usuario_id` (ya en el schema) referencia
`public.usuarios_web`, que **no es la misma tabla** que `usuarios_admin` de
`proyecto_matt` (Laravel tiene su propio login de backoffice, separado). Un
admin autenticado en Laravel no tiene automáticamente un id de `UsuarioWeb`.

Por eso `GradeSubmissionDto` exige `graded_by_usuario_id` explícito en el body
— Laravel debe conocer y enviar el id de `UsuarioWeb` (rol `ADMIN`)
correspondiente a quien calificó. Esto implica que **cada admin que califica
tareas necesita una cuenta `UsuarioWeb`** además de su cuenta `usuarios_admin`
de Laravel — no se resolvió una vinculación automática entre ambas tablas,
porque no existe hoy y crearla es una decisión de modelo de datos que le
corresponde al equipo, no a esta pasada de desarrollo.

## 4. `cantidad > 1` (compra corporativa) — no resuelto, contrato dejado abierto

El propio `schema.prisma` ya trae un comentario sobre esto (ver el modelo
`Enrollment`). La decisión tomada aquí: `EnrollmentService.enrollFromEcommerce()`
inscribe **una persona por llamada**. Si una orden tiene `cantidad=3`, quien
dispare la inscripción debe invocar el service 3 veces, una por persona. Cómo
se capturan esas 3 identidades (¿un formulario que llena el comprador al
finalizar la compra? ¿altas manuales desde el panel admin?) no se construyó —
es una decisión de producto, no solo técnica, y se deja fuera a propósito en
vez de improvisar una UI que probablemente haya que rehacer.

## 5. Sin tabla de auditoría dedicada

El documento pide "auditar quién originó cada operación" (§5). Se implementó
con `Logger` de NestJS (`req.m2mActor` en cada log de `AdminCoursesService`) —
no con una tabla persistente. Si se necesita un historial consultable (no solo
logs de aplicación), hace falta una tabla nueva tipo `lms.audit_log` — no se
agregó al schema porque no se pidió explícitamente y añadir tablas por cuenta
propia sin necesidad concreta va contra el criterio de "no diseñar para
hipotéticos".

## 6. Ruta de veredicto de examen: se devuelve por pregunta, no solo agregado

El documento no especifica el detalle de la respuesta de
`POST /quizzes/attempts/:id/submit`. Se decidió devolver, además de
`score`/`passed`, un arreglo `details: [{question_id, correct}]` — útil para
que el frontend muestre qué se falló sin exponer cuál era la opción correcta
(eso solo lo sabe quien ya respondió). Si el negocio prefiere no mostrar ese
detalle inmediatamente, es un cambio de una línea en `quizzes.service.ts`.

## 7. Contenido `DOCUMENT`: completado es "lo abrí", no "lo leí"

No hay forma de verificar servidor-side que alguien realmente leyó un PDF. Se
optó por marcar `COMPLETED` en cuanto el frontend llama a `mark-read` (acción
explícita del usuario, no automática al cargar la página) — es la misma
limitación que tiene cualquier LMS con contenido de solo lectura.

## 8. TRADICIONAL (Moodle) es de acceso abierto; ASINCRONO_VOD (Coursera) sigue con candado secuencial

`courses.service.ts::getCourseDetail()` calculaba el mismo desbloqueo
secuencial estricto para los dos modos — así quedó en la primera pasada,
cuando Moodle y Coursera compartían una sola pantalla de estudiante. Al
separar en `CursoTradicional.jsx`/`CursoVOD.jsx` (dos looks distintos, uno
por modo) se corrigió también el comportamiento real: un Moodle no obliga a
completar todo en orden — el estudiante entra a cualquier recurso o tarea
cuando quiera. Solo `ASINCRONO_VOD` mantiene el candado. Es la única
diferencia de comportamiento entre los dos modos en el backend; todo lo
demás (progreso, calificación, quiz) es igual para ambos.

## 9. El portón valida `Orden.estado`, no la tabla `pagos`

Se pidió validar contra "los pagos", pero la tabla `public.pagos` solo existe
para PayPal (la creó `paypal.service.ts` al capturar). Un pago por
transferencia aprobado a mano por un admin nunca pasa por esa tabla — solo
actualiza `Orden.estado` a `'PAGADA'`. Verificado leyendo el código real de
ambos flujos: PayPal *también* actualiza `Orden.estado` a `'PAGADA'` en la
misma transacción donde crea el `Pago`. Por eso `lms-gate.service.ts` valida
`Orden.estado='PAGADA'` — es el único campo que cubre los dos métodos de pago
reales del sitio. Decisión confirmada explícitamente con el usuario antes de
implementarla, no es una interpretación silenciosa.

## 10. Contenido del profesor sin selector de subida de archivos

`CursoProfesor.jsx` pide la URL de Cloudinary como texto — el profesor sube
el archivo por su cuenta a cloudinary.com (o donde sea) y pega el link. Un
selector de archivo con subida real desde el navegador necesita un *upload
preset* firmado en Cloudinary (para no exponer el `CLOUDINARY_API_SECRET` en
el cliente) — es trabajo real de infraestructura, no solo de UI, y se dejó
fuera de esta pasada a propósito en vez de improvisarlo.

## 11. Profesor nuevo: contraseña aleatoria + flujo de "olvidé mi contraseña" existente

`POST /api/lms/admin/professors` necesita crear una cuenta con contraseña
sin que el sistema interno tenga que inventar/transmitir una. Se generó una
contraseña aleatoria de 32 bytes que nadie llega a ver ni guardar, y se
reutilizó `AuthService.forgotPassword()` (el mismo flujo de "olvidé mi
contraseña" que ya usa el sitio público, con su propio correo Brevo) para
que el profesor defina la suya. No se construyó un flujo de invitación
nuevo — hubiera sido reimplementar algo que ya existe, probado, y usa la
misma UI de `/reset-password` que ya conocen los usuarios.

`cliente_id` es opcional a propósito: `Cliente.cedula` es obligatoria y
única, y no hay una cédula real que inventarle a un profesor que no viene de
un registro de `Cliente` existente. Sin `cliente_id`, su nombre no aparece
(sale "Profesor" genérico en vez del nombre real) — es una limitación
conocida, no un bug, documentada en `REQUISITOS_SISTEMA_INTERNO.md` §2.
