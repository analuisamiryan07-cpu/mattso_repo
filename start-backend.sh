#!/bin/bash
echo "Esperando a que la base de datos en el puerto 5432 esté activa..."
while ! nc -z localhost 5432; do
  sleep 2
done
echo "¡Base de datos detectada! Iniciando NestJS Backend..."
cd backend-matsso && npm run start:dev
