# Handoff técnico completo — MATsso Laravel MVC

**Estado documentado:** 15 de julio de 2026  
**Proyecto válido:** `proyecto_matt/`  
**Aplicación:** Laravel 12 / PHP 8.2 o superior / PostgreSQL  

Este documento describe el estado funcional que se validó localmente y los
pasos que debe seguir el agente del servidor para desplegarlo sin recuperar el
PHP procedural ni perder documentos históricos.

## 1. Resultado final

- Laravel es la única aplicación y vive directamente en la raíz de
  `proyecto_matt/`.
- No debe existir ni levantarse una segunda aplicación PHP en otro puerto.
- El único document root web es `proyecto_matt/public`.
- La base PostgreSQL existente sigue siendo la fuente de verdad.
- Los documentos se generan con plantillas privadas DOCX/XLSX, se comprimen en
  ZIP y se descargan mediante rutas autenticadas.
- Autenticación, roles, usuarios, clientes, documentos y pagos están dentro de
  Laravel MVC.

## 2. Qué se eliminó del sistema anterior

Se retiró por completo el PHP procedural que estaba en la raíz:

- `index.php`, `login.php`, `logout.php`, `register.php`
- `dashboard.php`, `secretaria.php`, `usuarios.php`
- `clientes.php`, `capacitaciones.php`, `pagos.php`, `generar.php`
- todo `includes/`
- el `vendor/`, `composer.json` y `composer.lock` del PHP anterior
- scripts antiguos `insertar_marcadores.py` y `preparar_plantillas.sh`

No se deben restaurar esos archivos en el servidor. Los archivos PHP que ahora
existen bajo `app/`, `routes/`, `config/`, `database/` y `public/index.php` son
parte normal de Laravel.

## 3. Qué se movió y dónde quedó

| Contenido anterior | Ubicación definitiva |
|---|---|
| Proyecto Laravel anidado en `laravel/` | raíz de `proyecto_matt/` |
| `plantillas/` | `resources/document-templates/` |
| `config/document_markers.php` | `config/document_markers.php` |
| `generados/` | `storage/app/private/generated/` |
| `Pruebas/` | `docs/reference/Pruebas/` |
| `Ficha_Tecnica_Sistema_Matsso.pdf` | `docs/reference/` |
| C08 original de referencia | `docs/reference/C08_original.docx` |
| logo anterior | `public/images/` |
| valores necesarios del `.env` anterior | `.env` propio de Laravel |

Las plantillas vigentes son:

- `c02_solicitud.xlsx`
- `c05_etica.docx`
- `c08_asistencia.docx`
- `c09_acuerdo.docx`
- `c10_notificacion.docx`
- `c12_encuesta.xlsx`
- `esquemas_y_examinadores_matsso.json`

## 4. Dependencias principales

Definidas en `composer.json`:

- PHP `^8.2`
- Laravel Framework `^12`
- PhpSpreadsheet `^2.1`
- PHPWord `^1.2`
- ZipArchive mediante la extensión PHP ZIP

El servidor debe tener como mínimo las extensiones PHP de PostgreSQL/PDO,
mbstring, XML/DOM, ZIP y las requeridas por PhpSpreadsheet/PHPWord.

Actualmente la vista principal utiliza CSS y JavaScript embebidos en Blade. No
es obligatorio ejecutar Vite para que este estado funcione. `package.json` y
`vite.config.js` quedan preparados para una futura compilación de frontend.

## 5. Arquitectura Laravel final

### Modelos

- `App\Models\User` usa la tabla `usuarios_admin`.
- `App\Models\Client` usa `clientes`.
- `App\Models\GeneratedDocument` usa `documentos_generados`.

### Controladores

- `AuthController`: login/logout.
- `DashboardController`: panel de administrador y secretaría.
- `UserController`: alta y activación/desactivación de usuarios.
- `ClientController`: historial y descargas privadas.
- `DocumentController`: formulario y generación de documentos.
- `PaymentApprovalController`: consulta y aprobación de pagos.
- `TrainingController`: pantalla de capacitaciones.

### Servicios

- `DocumentGenerationService`: normalización de datos, generación DOCX/XLSX,
  filas repetibles de C02, ZIP y registro transaccional.
- `PaymentApiService`: integración con el backend de pagos.
- `CertificationCatalog`: lee perfiles, esquemas y examinadores desde el JSON.

### Middleware y seguridad

- Todas las rutas funcionales requieren autenticación.
- `EnsureRole` exige usuario activo y rol exacto.
- Roles válidos: `ADMINISTRADOR` y `SECRETARIA`.
- La gestión de usuarios y pagos requiere `ADMINISTRADOR`.
- El registro público `/register` no existe.
- El login tiene limitación `throttle:5,1`.
- Se corrigió el bucle `/login -> / -> /login`: `/` ahora envía al panel del
  rol autenticado o al login si es invitado.
- Las descargas validan carpeta, nombre de archivo y pertenencia al registro.

## 6. Rutas funcionales

| Método y ruta | Función |
|---|---|
| `GET /login` | formulario de login |
| `POST /login` | autenticación |
| `POST /logout` | cierre de sesión |
| `GET /admin` | panel administrador |
| `GET /secretaria` | panel secretaría |
| `GET /admin/usuarios` | usuarios |
| `POST /admin/usuarios` | crear usuario |
| `PATCH /admin/usuarios/{user}/estado` | activar/desactivar |
| `GET /clientes` | historial de clientes/documentos |
| `GET /clientes/documentos/{document}/zip` | descargar ZIP privado |
| `GET /clientes/documentos/{document}/archivo/{file}` | descargar archivo privado |
| `GET /documentos/nuevo` | formulario de certificación |
| `POST /documentos` | generar documentos |
| `GET /admin/pagos` | órdenes de pago |
| `PATCH /admin/pagos/{order}` | aprobar/cambiar estado |
| `GET /capacitaciones` | módulo de capacitaciones |

## 7. Base de datos: qué se conservó y qué cambió

### Principio aplicado

La tabla `clientes` existente se conservó. No se creó una tabla paralela
`users` ni se reemplazaron datos comerciales.

### Migración 1

`2026_07_14_000000_create_missing_administrative_tables.php`

Solo crea las tablas si no existen:

#### `usuarios_admin`

- `id`
- `usuario` único
- `password_hash`
- `rol`
- `activo`
- `nombre_completo`
- `created_at`
- restricción de rol: solo `ADMINISTRADOR` o `SECRETARIA`

#### `documentos_generados`

- `id`
- `cliente_id`, FK hacia `clientes.id`
- `carpeta`
- `zip_ruta`
- `fecha_generacion`
- `n_archivos`
- `nombres_archivos` JSON
- `generado_por`

La FK actualiza en cascada y restringe el borrado del cliente.

### Migración 2

`2026_07_14_010000_add_c02_data_to_clients_table.php`

Añade a `clientes`:

- `datos_c02` JSON nullable

Este JSON conserva los datos estructurados adicionales:

- secuencia y fecha exclusiva C02
- edad, provincia y celular
- perfiles, esquemas y unidades
- instalaciones, dirección, sector y teléfono
- niveles educativos
- capacitaciones repetibles
- experiencias repetibles
- examinador seleccionado

### Estado local comprobado

Las dos migraciones figuran como `Ran`:

- batch 1: tablas administrativas
- batch 2: `clientes.datos_c02`

Además se comprobó:

- conexión PostgreSQL disponible
- contratos de las tres tablas compatibles
- roles válidos
- índice único sobre `clientes.cedula`

### Reglas para el servidor

- Hacer respaldo antes de migrar.
- Ejecutar `php artisan migrate --force`.
- **No ejecutar** `migrate:fresh`, `db:wipe`, `schema:drop` ni restauraciones que
  sustituyan la base sin aprobación y respaldo.
- No ejecutar seeders sobre producción; no hay un administrador de producción
  predeterminado.
- Si se copió una cuenta local de prueba con contraseña débil, cambiarla antes
  de exponer el sistema.

## 8. Almacenamiento privado y documentos históricos

Los archivos generados viven en:

`storage/app/private/generated/{carpeta}/`

Cada carpeta contiene los documentos individuales y su ZIP. La tabla
`documentos_generados` guarda el nombre de la carpeta y los archivos.

**Importante:** `storage/app/private/*` está ignorado por Git. En el equipo local
hay aproximadamente 138 MB distribuidos en 11 carpetas. Si se migra la base o
se quieren conservar descargas históricas, este directorio debe copiarse aparte
con `rsync`, `scp` o el mecanismo de respaldo del servidor. Un `git pull` no lo
transportará.

No se necesita `storage:link` para estas descargas: los archivos son privados y
Laravel los entrega después de autenticar al usuario.

## 9. Generación documental

El catálogo de marcadores está en `config/document_markers.php` y la explicación
humana en `docs/MAPA_VARIABLES_DOCUMENTOS.md`.

Flujo de generación:

1. validar formulario;
2. normalizar fechas, mayúsculas, teléfonos y catálogo;
3. generar los documentos seleccionados;
4. verificar que no existan marcadores desconocidos;
5. crear ZIP privado;
6. actualizar/crear cliente por cédula;
7. registrar `documentos_generados` dentro de una transacción.

Si falla cualquier etapa, se borra la carpeta incompleta y no se deja un
registro parcial.

### Reglas generales finales

- Teléfono de casa y celular son distintos, solo dígitos y máximo 10.
- Puntajes teórico y práctico son opcionales y pueden quedar vacíos.
- Provincia y ciudad/cantón son desplegables dependientes.
- El catálogo territorial está en `config/c02.php`.
- Perfil profesional y esquema son desplegables independientes tomados del
  JSON.
- El primer esquema es el esquema principal reutilizado por los demás
  documentos; los esquemas adicionales solo agregan filas al C02.
- Todos los examinadores del JSON aparecen en el desplegable. Al elegir uno se
  autocompletan cédula y teléfono.

### C02

- Tiene una fecha exclusiva `fecha_c02`, elegida por el usuario y distinta de
  la fecha general.
- Usa la dirección personal del candidato.
- Incluye edad, provincia, ciudad, teléfono de casa y celular.
- Perfil y esquema se seleccionan por separado.
- UC1 a UC5 se imprimen como `X` según las casillas seleccionadas.
- Permite filas adicionales para perfil/esquema/UC.
- Incluye nombre, dirección, sector y teléfono de instalaciones.
- Educación siempre permanece visible en el formulario; sus campos se habilitan
  al marcar Lectoescritura, Primaria, Secundaria, Artesano, Tercer nivel o
  Cuarto nivel.
- Capacitación y experiencia son repetibles con botón “Agregar”.
- El generador inserta filas adicionales conservando el formato del XLSX.

### C08

- Usa la fecha general.
- El lugar mostrado contiene **únicamente** `SMD_direccion_instalacion`.
- No concatena lugar, provincia, ciudad, sector ni dirección personal.
- `SMD_cedula` recibe la cédula del candidato.
- `SMD_telefono_candidato` recibe el celular personal.
- Nombre, cédula y teléfono del examinador salen del JSON.
- El formato manual final de cédula/teléfono del examinador es Century Gothic,
  negrita y tamaño Word 24 (12 pt). Este formato se comprobó después de generar.

### C09

- Usa la fecha general.
- Su dirección es exactamente `SMD_direccion_instalacion`, igual que C08.
- No utiliza la dirección personal del candidato.
- El teléfono documental recibe el celular personal.

### C10

- Usa ciudad y fecha general en formato largo, por ejemplo:
  `Guayaquil 10 de marzo de 2026`.
- Usa el esquema principal ya seleccionado; no solicita otro esquema.
- Se retiraron textos de ejemplo que estaban incrustados en la plantilla.

### C12

- `G86` usa `SMD_direccion_instalacion`.
- Muestra únicamente la dirección de instalaciones, igual que C08/C09.
- Usa la fecha general y el nombre del examinado.
- Se corrigió el marcador histórico mal escrito
  `SMD_lugardeexaminaxion`.

### Plantillas binarias: advertencia

Las plantillas actuales contienen cambios manuales finales de formato. Son la
fuente de verdad. No deben regenerarse ni sustituirse durante el despliegue.

`scripts/normalize_template_markers.php` es una herramienta de mantenimiento,
no un comando de instalación. No ejecutarla en producción salvo que se revise
previamente una copia de respaldo y se quiera normalizar deliberadamente todas
las plantillas.

## 10. Catálogo JSON

Archivo:

`resources/document-templates/esquemas_y_examinadores_matsso.json`

Contiene:

- `esquemas_certificacion`: perfiles y esquemas disponibles;
- `examinadores`: nombre, código, esquema, cédula, correo y teléfono.

`CertificationCatalog`:

- elimina perfiles duplicados del desplegable;
- devuelve perfiles y esquemas por separado;
- normaliza cédula y teléfono del examinador quitando espacios;
- usa el campo `no` del JSON como identificador del examinador.

## 11. Integración de pagos

Variables:

- `BACKEND_URL`
- `ADMIN_API_KEY`

Operaciones:

- `GET /api/ordenes`
- `PATCH /api/ordenes/{id}/estado`
- header `x-admin-key`

El servicio valida que los comprobantes pertenezcan al mismo host configurado.
Cuando una orden pasa a `PAGADA`, actualiza o crea el cliente por cédula dentro
de una transacción.

Probar la API real primero contra staging. `php artisan matsso:verify --api`
hace una consulta externa y no debe ejecutarse sin confirmar el entorno.

## 12. Variables de entorno necesarias

Crear `.env` desde `.env.example`. No copiar `.env` a Git ni enviar secretos por
chat.

Variables mínimas:

```dotenv
APP_NAME="MATsso MVC"
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://dominio-real

DB_CONNECTION=pgsql
DB_HOST=host-postgresql
DB_PORT=5432
DB_DATABASE=matssoecuador
DB_USERNAME=usuario
DB_PASSWORD=secreto

SESSION_DRIVER=file
SESSION_SECURE_COOKIE=true
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync

DOCUMENT_TEMPLATE_PATH=
BACKEND_URL=https://backend-real
ADMIN_API_KEY=secreto
```

Si `DOCUMENT_TEMPLATE_PATH` queda vacío, se usa
`resources/document-templates`.

En desarrollo local se validó PostgreSQL en `127.0.0.1:5433` y Laravel en
`127.0.0.1:8001`. Esos puertos no deben copiarse ciegamente al servidor.

## 13. Procedimiento recomendado para acoplar el servidor

### A. Respaldar

1. Respaldar PostgreSQL completo.
2. Respaldar `storage/app/private/generated` del servidor actual.
3. Respaldar las plantillas actuales del servidor.
4. Guardar el `.env` actual fuera del release.

### B. Transferir el código

Transferir la raíz Laravel completa, incluyendo las plantillas binarias.

El estado local todavía aparece como una sustitución amplia y no confirmada en
Git: muchos archivos antiguos figuran eliminados y Laravel figura añadido. Un
agente que solo haga `git pull` desde una rama que no contenga estos cambios no
recibirá el sistema funcional. Antes del despliegue hay que:

- confirmar/commitear y publicar todos estos cambios en una rama, **o**
- transferir el árbol completo de `proyecto_matt/` como artefacto.

No transferir `vendor/` desde otra plataforma si el servidor puede ejecutar
Composer.

### C. Instalar

```bash
cd /ruta/proyecto_matt
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
cp .env.example .env   # solo si todavía no existe .env
php artisan key:generate --force   # solo para una instalación nueva
```

No regenerar `APP_KEY` si el servidor ya tenía sesiones/datos cifrados que se
deben conservar.

### D. Configurar permisos

El usuario de PHP-FPM debe poder escribir en:

- `storage/`
- `bootstrap/cache/`

No dar permisos de escritura públicos a todo el proyecto.

### E. Restaurar documentos privados

Copiar o sincronizar por separado:

```bash
rsync -a origen/storage/app/private/generated/ \
  /ruta/proyecto_matt/storage/app/private/generated/
```

Verificar que cada `documentos_generados.carpeta` tenga su carpeta física.

### F. Migrar y validar

```bash
php artisan optimize:clear
php artisan migrate --force
php artisan matsso:verify
php artisan route:list
```

Después de validar:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### G. Nginx

El `root` debe apuntar a `public`, nunca a la raíz del repositorio:

```nginx
server {
    listen 80;
    server_name dominio-real;
    root /ruta/proyecto_matt/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    location ~ /\. {
        deny all;
    }
}
```

Ajustar el socket a la versión real de PHP-FPM y habilitar HTTPS.

## 14. Pruebas y verificaciones

Hay 17 pruebas registradas, que cubren:

- autenticación, redirects y ausencia de registro público;
- roles y usuario compatible;
- catálogo de documentos;
- formulario y validaciones C02;
- generación C02 con filas repetibles;
- enrutamiento de fechas, direcciones, celular, esquema y examinador;
- conservación de negrita/tamaño del examinador en C08;
- eliminación de marcadores residuales;
- apertura de las seis plantillas;
- API de pagos simulada.

Comandos:

```bash
php artisan test
php artisan test --filter=C02GenerationTest
php artisan test --filter=DocumentFieldRoutingTest
php artisan test --filter=DocumentMarkerCoverageTest
php artisan test --filter=TemplateCompatibilityTest
php artisan matsso:verify
```

Las pruebas de documentos consumen memoria y tiempo porque abren/generan varios
DOCX/XLSX. En un servidor limitado conviene ejecutarlas por grupos. En el estado
final se comprobaron por separado:

- routing documental: 1 prueba, 22 assertions;
- marcadores, pagos y compatibilidad: 3 pruebas, 23 assertions;
- formulario/generación/routing C02: aprobadas en su grupo correspondiente.

`matsso:verify` terminó completamente en `OK` para plantillas, storage,
PostgreSQL, contratos, roles, índice único y configuración de pagos.

## 15. Checklist de aceptación en staging

- [ ] `/login` abre sin bucle de redirects.
- [ ] Admin entra a `/admin` y Secretaría a `/secretaria`.
- [ ] No existe `/register`.
- [ ] Se puede crear y desactivar un usuario.
- [ ] Todos los examinadores del JSON aparecen en el desplegable.
- [ ] Cédula y teléfono del examinador se autocompletan.
- [ ] Provincia filtra ciudad/cantón.
- [ ] Educación, capacitación y experiencia permanecen visibles.
- [ ] C02 usa su fecha exclusiva y dirección personal.
- [ ] C08 usa fecha general, celular y solo dirección de instalaciones.
- [ ] C09 usa la misma dirección de instalaciones.
- [ ] C10 muestra ciudad + fecha larga y el esquema principal.
- [ ] C12 llena G86 con dirección de instalaciones.
- [ ] C08 conserva Century Gothic, negrita y 12 pt en cédula/teléfono del examinador.
- [ ] ZIP y archivos individuales descargan autenticados.
- [ ] Históricos siguen descargando después de copiar storage.
- [ ] Pagos se prueban contra staging antes de producción.

## 16. Rollback

Conservar antes del corte:

- dump restaurable de PostgreSQL;
- copia de `storage/app/private`;
- release anterior;
- `.env` anterior.

Si falla el código, volver al release anterior y limpiar cachés. No revertir la
base ni borrar `datos_c02` sin evaluar los datos ya escritos. Las migraciones
`down()` existen, pero no deben ejecutarse automáticamente en producción.

## 17. Archivos clave para continuar

- `app/Services/DocumentGenerationService.php`
- `app/Http/Requests/GenerateDocumentsRequest.php`
- `app/Support/CertificationCatalog.php`
- `resources/views/documents/create.blade.php`
- `resources/document-templates/`
- `config/document_markers.php`
- `config/c02.php`
- `docs/MAPA_VARIABLES_DOCUMENTOS.md`
- `database/migrations/`
- `tests/Feature/C02GenerationTest.php`
- `tests/Feature/DocumentFieldRoutingTest.php`
- `tests/Feature/DocumentMarkerCoverageTest.php`

Este conjunto, las dos migraciones y el storage privado forman una sola unidad
de despliegue. Copiar únicamente controladores o únicamente plantillas dejaría
el servidor en un estado incompatible.
