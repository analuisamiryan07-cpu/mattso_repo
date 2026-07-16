# MATsso MVC

Aplicación administrativa construida con Laravel 12. Laravel es el único punto
de entrada y concentra autenticación, usuarios, clientes, documentos y pagos.

## Preparación local

1. Copiar `.env.example` a `.env` y configurar PostgreSQL y la API de pagos.
2. Las plantillas se encuentran en `resources/document-templates`. Para usar
   otra ubicación se puede definir `DOCUMENT_TEMPLATE_PATH`.
3. Ejecutar `php artisan key:generate`, `php artisan optimize:clear` y
   `php artisan test`.
4. Ejecutar `php artisan matsso:verify` para validar PostgreSQL, plantillas y
   configuración. Usar `--api` únicamente contra staging.
5. Levantar temporalmente con `php artisan serve`.

No ejecutar `php artisan migrate` sobre producción hasta generar y revisar el
volcado descrito en `database/schema/README.md`.

## Módulos disponibles

- Login sobre `usuarios_admin`, sesiones seguras y roles.
- Paneles de administrador y secretaría.
- Gestión administrativa de usuarios.
- Historial de clientes y descarga autorizada de ZIP.
- Generación DOCX/XLSX mediante un servicio de dominio.
- Aprobación de pagos mediante el backend externo.
- Pantalla de alcance para capacitaciones.

Consulta `docs/DESPLIEGUE.md` para el despliegue y rollback.
Para trasladar el estado funcional completo a otro servidor o agente, seguir
`docs/HANDOFF_SERVIDOR.md`.
