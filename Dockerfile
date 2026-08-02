# syntax=docker/dockerfile:1.7
# dev-tracker — multi-stage build for production

# =============================================================================
# Base Stage — setup alpine & corepack
# =============================================================================
FROM node:26-alpine AS base
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@latest --activate
# Prisma requires openssl in alpine
RUN apk add --no-cache openssl
WORKDIR /app

# =============================================================================
# Deps Stage — install all dependencies
# =============================================================================
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# =============================================================================
# Build Stage — generate Prisma & compile app
# =============================================================================
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Genera el cliente de Prisma
RUN pnpm exec prisma generate
# Compila backend y frontend
RUN pnpm run build
# Elimina devDependencies para la imagen final
RUN CI=true pnpm prune --prod --ignore-scripts

# =============================================================================
# Runner Stage — production minimal image
# =============================================================================
FROM node:26-alpine AS runner
WORKDIR /app

# Asegurar permisos correctos para el usuario node
RUN chown -R node:node /app

# Ejecutar como usuario no root
USER node

ENV NODE_ENV=production
ENV PORT=6789

# Copiar solo lo estrictamente necesario
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./

# Volumen para SQLite
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 6789

CMD ["node", "dist/src/server/index.js"]