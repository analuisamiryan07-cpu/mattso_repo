# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Instalar dependencias primero (aprovecha el cache de Docker)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copiar fuente y compilar TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Etapa 2: Producción ────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Solo instalar dependencias de producción (incluye prisma CLI ahora en dependencies)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev && npm cache clean --force

# Copiar binarios Prisma y build compilado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# Crear carpeta para comprobantes de pago
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]
