# Dockerfile para el backend de Canectt (apps/api).
# Multi-stage: instala deps, compila TypeScript, ejecuta con Node en producción.

# --- Stage 1: Instalar dependencias ---
FROM node:20-slim AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/schema/package.json packages/schema/
COPY packages/config/package.json packages/config/
COPY packages/recognition-engine/package.json packages/recognition-engine/
COPY packages/export-engine/package.json packages/export-engine/
COPY packages/design-tokens/package.json packages/design-tokens/
RUN pnpm install --frozen-lockfile --prod

# --- Stage 2: Build ---
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api apps/api
COPY packages packages
COPY config config
# Necesitamos devDependencies para compilar (tsc).
RUN pnpm install --frozen-lockfile
# Build packages en orden de dependencias.
RUN pnpm --filter @canectt/design-tokens build \
  && pnpm --filter @canectt/schema build \
  && pnpm --filter @canectt/config build \
  && pnpm --filter @canectt/recognition-engine build \
  && pnpm --filter @canectt/export-engine build \
  && pnpm --filter @canectt/api build

# --- Stage 3: Producción ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Copiar solo lo necesario para producción.
COPY --from=builder /app/package.json pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/packages/schema/dist packages/schema/dist
COPY --from=builder /app/packages/schema/package.json packages/schema/
COPY --from=builder /app/packages/config/dist packages/config/dist
COPY --from=builder /app/packages/config/package.json packages/config/
COPY --from=builder /app/packages/recognition-engine/dist packages/recognition-engine/dist
COPY --from=builder /app/packages/recognition-engine/package.json packages/recognition-engine/
COPY --from=builder /app/packages/export-engine/dist packages/export-engine/dist
COPY --from=builder /app/packages/export-engine/package.json packages/export-engine/
COPY --from=builder /app/packages/design-tokens/dist packages/design-tokens/dist
COPY --from=builder /app/packages/design-tokens/package.json packages/design-tokens/
COPY --from=builder /app/config config
# Instalar solo dependencias de producción del workspace.
RUN corepack enable && pnpm install --frozen-lockfile --prod

EXPOSE 8787

# dumb-init maneja señales correctamente (PID 1).
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]
