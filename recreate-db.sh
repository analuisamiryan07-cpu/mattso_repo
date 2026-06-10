#!/bin/bash
set -e

echo "🛑 Eliminando contenedor anterior 'mi-postgres-local' (si existe)..."
sudo docker rm -f mi-postgres-local || true

echo "🚀 Iniciando nuevo contenedor de PostgreSQL 16..."
sudo docker run --name mi-postgres-local \
  -e POSTGRES_PASSWORD=123qwe \
  -p 5432:5432 \
  -d postgres:16

echo "⏳ Esperando 5 segundos a que la base de datos esté lista para recibir conexiones..."
sleep 5

echo "📁 Creando base de datos 'matssoecuador'..."
sudo docker exec -i mi-postgres-local psql -U postgres -c "CREATE DATABASE matssoecuador;"

echo "⚙️ Inicializando esquema de tablas (00_matsso_full_database.sql)..."
sudo docker exec -i mi-postgres-local psql -U postgres -d matssoecuador < "./db_scripts/00_matsso_full_database.sql"

echo "📊 Insertando datos de catálogo y sectores (02_matsso_dml_inserts.sql)..."
sudo docker exec -i mi-postgres-local psql -U postgres -d matssoecuador < "./db_scripts/02_matsso_dml_inserts.sql"

echo "🛠️ Creando procedimientos almacenados (03_sp_crud.sql)..."
sudo docker exec -i mi-postgres-local psql -U postgres -d matssoecuador < "./db_scripts/03_sp_crud.sql"

echo "🔍 Creando índices y vistas (04_indices_vistas_datos.sql)..."
sudo docker exec -i mi-postgres-local psql -U postgres -d matssoecuador < "./db_scripts/04_indices_vistas_datos.sql"

echo "🔐 Inicializando tablas de PHP Backoffice (05_setup_local_admin.sql)..."
sudo docker exec -i mi-postgres-local psql -U postgres -d matssoecuador < "./db_scripts/05_setup_local_admin.sql"

echo "🎉 ¡Base de datos recreada, inicializada y poblada al 100% con éxito!"
