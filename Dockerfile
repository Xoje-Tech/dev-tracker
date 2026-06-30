# syntax=docker/dockerfile:1.7
# dev-tracker — multi-stage build for production

# =============================================================================
# Build stage — full toolchain, produces compiled dist/
# =============================================================================
FROM node:26 AS build

WORKDIR /app

# Enable pnpm via corepack (corepack ships with Node but needs explicit install in slim images)
RUN npm install -g corepack@latest \
    && corepack enable

# Install deps first (better layer caching)
# pnpm-workspace.yaml carries the allowBuilds config (pnpm 11+); both must be in the build context
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Generate Prisma client + build
COPY prisma ./prisma
RUN pnpm db:generate

COPY . .
RUN pnpm build

# Drop dev dependencies — keeps the runtime image lean
# Set CI=true so pnpm prune doesn't prompt for TTY confirmation
RUN CI=true pnpm prune --prod

# =============================================================================
# Runtime stage — minimal image, non-root, healthcheck
# =============================================================================
FROM node:26-slim AS runtime

# wget is needed for HEALTHCHECK (not in node:26-slim by default)
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Run as non-root (the 'node' user is built into the official image)
USER node

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Copy only what the runtime needs
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./

# Data directory for SQLite — mount a named volume here in compose
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Entrypoint applies Prisma schema (idempotent for SQLite) before starting
COPY --from=build --chown=node:node /app/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/server/index.js"]