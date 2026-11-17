# Planify · imagen de producción (docs/10)
# Etapas: deps → build (también usada por el servicio `migrate`) → runner.

# 1. Dependencias
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# El postinstall (`prisma generate`) necesita el esquema, que aún no está
# copiado; se genera en la etapa build.
RUN npm ci --ignore-scripts

# 2. Build (Prisma + Next standalone). El servicio `migrate` del compose
#    reutiliza esta etapa porque incluye el CLI de Prisma y las migraciones.
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Marcadores de posición solo para el build (Next evalúa módulos al compilar).
# En runtime, docker-compose inyecta los valores reales desde `.env`.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV BETTER_AUTH_SECRET="build-time-placeholder"
ENV BETTER_AUTH_URL="http://localhost:3000"
RUN npx prisma generate && npm run build

# 3. Runtime mínimo
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# `server.js` del standalone escucha en `process.env.HOSTNAME`, que Docker fija
# al ID del contenedor: sin esto solo atiende a su IP de red y el healthcheck
# (`wget http://localhost:3000/api/health`) falla con "Connection refused".
ENV HOSTNAME=0.0.0.0
RUN addgroup -S next && adduser -S next -G next
# Volumen de subidas (compose monta `uploads:/data/uploads`): se crea con dueño
# `next` para que el volumen nombrado herede el dueño al inicializarse (Docker
# copia el contenido de la imagen al volumen vacío). Sin esto la app corre como
# `next` pero no puede escribir y toda subida falla con EACCES.
RUN mkdir -p /data/uploads && chown -R next:next /data

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY docker/entrypoint.sh /entrypoint.sh
# Reset administrativo de contraseña (RF-105): disponible dentro del contenedor
# con `docker compose exec app node scripts/reset-password.mjs` (docs/10 · 10.12).
COPY scripts/reset-password.mjs ./scripts/reset-password.mjs
# tr elimina los CR de un clon en Windows (CRLF): el shebang con CR rompe
# el arranque con "exec /entrypoint.sh: no such file or directory".
RUN tr -d '\r' < /entrypoint.sh > /entrypoint.sh.tmp && \
    mv /entrypoint.sh.tmp /entrypoint.sh && \
    chmod +x /entrypoint.sh

USER next
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
