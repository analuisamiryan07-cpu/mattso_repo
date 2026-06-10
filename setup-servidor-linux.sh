#!/bin/bash
# setup-servidor-linux.sh
# Inicializa la base de datos PostgreSQL NATIVA del servidor local de producción.
# Ejecutar UNA SOLA VEZ en el servidor Linux con PostgreSQL instalado de forma nativa.
#
# Prerequisitos:
#   sudo apt install postgresql postgresql-contrib
#   sudo systemctl start postgresql
#
# Uso:
#   chmod +x setup-servidor-linux.sh
#   bash setup-servidor-linux.sh

set -e

DB_NAME="matssoecuador"
DB_PASSWORD="${POSTGRES_PASSWORD:-123qwe}"
SCRIPTS_DIR="$(cd "$(dirname "$0")/db_scripts" && pwd)"

echo "============================================================"
echo "  MATSSO — Setup Base de Datos Local (Servidor Linux)"
echo "============================================================"
echo ""

# 1. Verificar que psql está disponible
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql no encontrado."
    echo "Instala con: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

# 2. Verificar que el servicio PostgreSQL está activo
if ! sudo systemctl is-active --quiet postgresql; then
    echo "Iniciando servicio PostgreSQL..."
    sudo systemctl start postgresql
fi

# 3. Establecer contraseña del usuario postgres (necesario para conexiones TCP de PHP)
echo "Paso 1/7 — Configurando contraseña del usuario postgres..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';"

# 4. Crear la base de datos
echo "Paso 2/7 — Creando base de datos '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "  (Ya existe, continuando...)"

# 5. Ejecutar scripts SQL
echo "Paso 3/7 — Inicializando esquemas y tablas..."
sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPTS_DIR/00_matsso_full_database.sql"

echo "Paso 4/7 — Insertando catálogo de certificaciones..."
sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPTS_DIR/02_matsso_dml_inserts.sql"

echo "Paso 5/7 — Creando procedimientos almacenados..."
sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPTS_DIR/03_sp_crud.sql"

echo "Paso 6/7 — Creando índices y vistas..."
sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPTS_DIR/04_indices_vistas_datos.sql"

echo "Paso 7/7 — Inicializando tablas del sistema local..."
sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPTS_DIR/05_setup_local_admin.sql"

echo ""
echo "============================================================"
echo "  Base de datos lista."
echo ""
echo "  Contraseña PostgreSQL configurada: $DB_PASSWORD"
echo ""
echo "  SIGUIENTE PASO obligatorio:"
echo "  Edita proyecto_matt/.env y actualiza:"
echo "    DB_PASSWORD=$DB_PASSWORD"
echo "    BACKEND_URL=https://TU-SERVICIO.onrender.com"
echo "    ADMIN_API_KEY=la_misma_que_configuraste_en_Render"
echo "============================================================"
