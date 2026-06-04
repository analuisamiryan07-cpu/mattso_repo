#!/bin/bash
# Script para iniciar la base de datos y actualizar el esquema con Prisma

echo "🚀 Iniciando contenedor de PostgreSQL (mi-postgres-local)..."
sudo docker start mi-postgres-local

echo "⏳ Esperando a que el puerto 5432 esté listo..."
until nc -z localhost 5432; do
  sleep 1
done
echo "✅ Base de datos activa!"

echo "🔄 Actualizando esquema de la base de datos..."
cd backend-matsso
npx prisma db push
npx prisma generate

echo "🎉 ¡Esquema actualizado con éxito!"
