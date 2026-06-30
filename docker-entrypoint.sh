#!/bin/sh
# Container entrypoint for dev-tracker.
# Idempotently applies the Prisma schema to the SQLite database, then execs the CMD.
#
# The --accept-data-loss flag is safe for SQLite here because:
#   1. We ship schema.prisma at build time; the runtime schema matches it.
#   2. If the DB file doesn't exist, prisma db push creates it.
#   3. For destructive migrations, deploy via `prisma migrate` first (out of band).

set -e

echo "[dev-tracker] Applying Prisma schema to ${DATABASE_URL:-file:./data/dev.db}..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "[dev-tracker] Starting server..."
exec "$@"