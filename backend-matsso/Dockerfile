# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (aprovecha el cache de Docker)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production=false

# Copiar fuente y compilar TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Etapa 2: Producción ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Solo instalar dependencias de producción
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

# Copiar binarios Prisma y build compilado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# Crear carpeta para comprobantes de pago
RUN mkdir -p uploads

EXPOSE 3000

# Ejecutar migraciones y luego iniciar la app
CMD ["node", "dist/main.js"]
