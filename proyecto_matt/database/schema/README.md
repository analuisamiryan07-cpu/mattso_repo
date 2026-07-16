# Esquema PostgreSQL existente

Esta aplicación se conecta a `usuarios_admin`, `clientes` y `documentos_generados`.
La base local ya contenía `clientes`, pero no las dos tablas administrativas; la
migración incremental `2026_07_14_000000_create_missing_administrative_tables.php`
crea solamente las tablas ausentes y nunca crea una tabla `users` paralela.

Antes de desplegar se debe guardar aquí un volcado **solo de esquema**, generado
desde una copia o mediante un usuario PostgreSQL de solo lectura:

```bash
pg_dump --schema-only --no-owner --no-privileges matssoecuador > database/schema/legacy-baseline.sql
```

Después se validarán tipos, claves foráneas, valores por defecto, índices y la
restricción única de `clientes.cedula`. Las futuras modificaciones sí deberán
crearse como migraciones incrementales y probarse primero en staging.
