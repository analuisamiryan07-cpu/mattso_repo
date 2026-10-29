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
# /etc/nginx/conf.d/matsso-ratelimit.conf  (contexto http)
limit_req_zone $binary_remote_addr zone=matsso_login:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=matsso_general:10m rate=10r/s;
server_tokens off;   # no revelar la versión de nginx

# HTTP -> HTTPS
server {
    listen 80;
    server_name dominio-real;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dominio-real;

    # Certificado (p. ej. Let's Encrypt / certbot)
    ssl_certificate     /etc/letsencrypt/live/dominio-real/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dominio-real/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_tickets off;

    # El root SIEMPRE apunta a public/, nunca a la raíz del proyecto (.env, storage, vendor)
    root /ruta/proyecto_matt/public;
    index index.php;
    charset utf-8;

    # Límites (alinear con upload_max_filesize / post_max_size de PHP)
    client_max_body_size 20m;
    client_body_timeout 15s;
    client_header_timeout 15s;
    keepalive_timeout 30s;

    # Cabeceras de seguridad
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" always;

    limit_req zone=matsso_general burst=40 nodelay;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Fuerza bruta en el login del backoffice
    location = /login {
        limit_req zone=matsso_login burst=5 nodelay;
        try_files $uri /index.php?$query_string;
    }

    # Solo se ejecuta index.php — nunca otros .php subidos o dejados en public/
    location = /index.php {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_hide_header X-Powered-By;
    }
    location ~ \.php$ { return 404; }

    # Archivos ocultos (.env, .git, .htaccess) y respaldos/volcados
    location ~ /\.(?!well-known) { deny all; }
    location ~* \.(env|log|sql|dump|bak|old|swp|ini|sh|zip|tar|gz)$ { deny all; }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
}
```

Ajustar el socket a la versión real de PHP-FPM. Probar con `sudo nginx -t` antes de `sudo systemctl reload nginx`.

## Rollback

- Respaldar base y documentos antes de cada despliegue.
- Conservar el artefacto de la versión anterior.
- Si falla la validación, desplegar ese artefacto; no revertir datos sin un
  procedimiento aprobado y un respaldo restaurable.
