# Dockerfile multi-stage para Canectt.
# Construye web (Vite) y api (Express) en una sola imagen,
# servida por un proceso supervisor ligero.

# --- Stage 1: Instalar dependencias ---
FROM node:20-slim AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/schema/package.json packages/schema/
COPY packages/recognition-engine/package.json packages/recognition-engine/
COPY packages/export-engine/package.json packages/export-engine/
RUN pnpm install --frozen-lockfile

# --- Stage 2: Build ---
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build packages en orden de dependencias.
RUN pnpm --filter @canectt/design-tokens build \
  && pnpm --filter @canectt/schema build \
  && pnpm --filter @canectt/recognition-engine build \
  && pnpm --filter @canectt/export-engine build \
  && pnpm --filter @canectt/web build \
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
COPY --from=builder /app/apps/web/dist apps/web/dist
COPY --from=builder /app/packages/schema/dist packages/schema/dist
COPY --from=builder /app/packages/schema/package.json packages/schema/
COPY --from=builder /app/packages/recognition-engine/dist packages/recognition-engine/dist
COPY --from=builder /app/packages/recognition-engine/package.json packages/recognition-engine/
COPY --from=builder /app/packages/export-engine/dist packages/export-engine/dist
COPY --from=builder /app/packages/export-engine/package.json packages/export-engine/
COPY --from=builder /app/packages/design-tokens/dist packages/design-tokens/dist
COPY --from=builder /app/packages/design-tokens/package.json packages/design-tokens/
COPY --from=builder /app/node_modules node_modules

# Servir el web estático con `serve` y el API con Node.
RUN npx --yes serve@14 --version || true

EXPOSE 5173 8787

# dumb-init maneja señales correctamente (PID 1).
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx serve apps/web/dist -l 5173 & node apps/api/dist/server.js"]
