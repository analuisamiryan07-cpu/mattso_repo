# Revisión de seguridad e-commerce y colección LMS — 3 de septiembre de 2026

## Alcance

Revisión estática de:

- `Moodles/DESPLIEGUE_VERIFICACION_FIX_SEGURIDAD_2026-09-01.md`;
- `Moodles/MATSSO_LMS_Security.postman_collection.json`;
- `Moodles/arquitectura_lms.md`.

No se ejecutó la colección contra producción, no se modificó NestJS/React y no se inspeccionó Git.

## Veredicto

**Las correcciones descritas son razonables, pero no existe evidencia suficiente para declarar finalizadas las pruebas de seguridad.** El MD describe cambios y motivos, no una ejecución reproducible. La colección contiene 96 solicitudes con scripts, pero no es un reporte de resultados y varias aserciones son permisivas o quedaron incompatibles con los cambios descritos.

## Bloqueantes de evidencia

1. No existe exportación Newman JSON/JUnit/HTML con fecha, ambiente, versión desplegada, solicitudes, aserciones, aprobados y fallidos.
2. No constan comandos de ejecución, códigos de respuesta observados ni evidencia de que las pruebas se corrieron después del despliegue.
3. Las carpetas LMS 10, 11 y 12 aceptan `404` como resultado válido porque los endpoints están planeados. Sirven como catálogo futuro, no como prueba de seguridad implementada.

## Problemas de la colección

1. `CHAT-01`, `CHAT-02` y `CHAT-03` no envían `Authorization`, pero el cambio documentado protege `/api/contacto` con `JwtAuthGuard`. `CHAT-01` continúa exigiendo 200/201, por lo que la colección está desactualizada respecto del cambio.
2. `CAT-06` considera aprobada la ejecución si un precio negativo es aceptado: crea una prueba que afirma `true === true`. Debe exigir exclusivamente 400/422 y comprobar que no se creó el producto.
3. `ORD-03` permite 200/201 para cantidad negativa si el total termina positivo. Debe exigir rechazo 400/422 y ausencia de orden/archivo creado.
4. `CHAT-08` solo exige “no 500”; después de `MaxLength(500)` debe exigir 400.
5. `LMS-VOD-03` registra una advertencia y después afirma `true === true`; no detectaría el bypass que pretende probar.
6. Aceptar ampliamente 404 en LMS puede ocultar una ruta mal nombrada una vez implementado. Las aserciones deberán endurecerse al habilitar cada módulo.
7. La colección contiene una contraseña de usuario de prueba en texto claro. Si esa cuenta existe en producción, se debe rotar o eliminar y pasar el secreto por entorno seguro; no debe quedar como valor exportado.
8. Varias solicitudes crean productos, órdenes, contactos o usuarios. La colección completa no debe ejecutarse contra producción sin prefijos de datos de prueba, limpieza comprobada, prohibición de operaciones comerciales reales y autorización explícita.

## Revisión de las correcciones descritas

- DTOs y validación de cantidades/precios: dirección correcta, pendiente de evidencia posterior al despliegue.
- Autenticación de contacto: dirección correcta si la política empresarial exige usuario autenticado; actualizar pruebas y confirmar que el frontend envía JWT.
- Saneamiento con `input.replace(/<[^>]*>/g, '')`: defensa parcial, no sustituto de codificación por contexto. Para HTML de correo se debe escapar contenido no confiable al construir el HTML. Una expresión regular de etiquetas no debe presentarse como garantía general contra XSS.
- QR: `fecha_emision` y `fecha_expiracion` deben validarse como fechas ISO y debe comprobarse que expiración no preceda emisión; exigir solo presencia no basta.
- Uploads: comprobar que el mensaje de tipos permitidos ya no mencione PDF si PDF fue retirado de `ALLOWED_MIME_TYPES`.
- La copia local disponible de `backend-matsso` no contiene los cambios descritos; puede ser normal porque el despliegue se realizó desde el repositorio separado de la colega, pero impide verificar aquí los archivos productivos. No se usó Git por restricción expresa.

## Evidencia requerida para conformidad

1. Colección corregida con aserciones estrictas.
2. Environment sin secretos exportados.
3. Ejecución primero en staging o ambiente desechable.
4. Reporte Newman JSON y JUnit/HTML conservado.
5. Cero fallos; cualquier omisión o endpoint no implementado debe aparecer como omitido, no aprobado por devolver 404.
6. Pruebas específicas posteriores al despliegue para los endpoints corregidos.
7. Confirmación de que las pruebas mutantes no dejaron productos, órdenes, usuarios ni correos operativos de prueba.

## Separación del LMS

`arquitectura_lms.md` es una propuesta de arquitectura, no evidencia de implementación. Los grupos 10–12 de Postman deben mantenerse marcados como planeados y fuera del resultado de seguridad del e-commerce actual hasta que existan sus endpoints.

