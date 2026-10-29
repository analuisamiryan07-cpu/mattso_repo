# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Parches de seguridad del sistema base + openssl para Prisma
RUN apk upgrade --no-cache && apk add --no-cache openssl

# Instalar dependencias exactamente como están en package-lock.json (reproducible)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copiar fuente y compilar TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Etapa 2: Producción ────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN apk upgrade --no-cache && apk add --no-cache openssl

ENV NODE_ENV=production

# Solo dependencias de producción
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm cache clean --force

# Copiar binarios Prisma y build compilado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# No ejecutar como root: si alguien lograra ejecutar código dentro del
# contenedor, no tendría privilegios de administrador.
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/api/health || exit 1

CMD ["node", "dist/main.js"]
