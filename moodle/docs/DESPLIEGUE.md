# Despliegue de MATsso MVC

## Estado

Laravel es la única aplicación. Las plantillas viven en
`resources/document-templates`, los documentos generados en
`storage/app/private/generated` y se descargan únicamente mediante rutas
autenticadas.

## Validación previa

1. Crear un respaldo completo de PostgreSQL y de `storage/app/private`.
2. Completar `.env` sin copiar secretos al repositorio. En producción usar
   `APP_DEBUG=false` y `SESSION_SECURE_COOKIE=true` bajo HTTPS.
3. Ejecutar `php artisan migrate --force`, `php artisan test` y
   `php artisan matsso:verify`.
4. Comparar los seis documentos generados con los archivos de
   `docs/reference/Pruebas`.
5. Probar la aprobación de pagos contra el backend del entorno correspondiente.

## Nginx

```nginx
server {
    listen 80;
    server_name matsso.local;
    root /ruta/proyecto_matt/public;
    index index.php;

    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }
    location ~ /\. { deny all; }
}
```

## Rollback

- Respaldar base y documentos antes de cada despliegue.
- Conservar el artefacto de la versión anterior.
- Si falla la validación, desplegar ese artefacto; no revertir datos sin un
  procedimiento aprobado y un respaldo restaurable.
