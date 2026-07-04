#!/usr/bin/env bash
set -e

echo "==> Bootstrapping dev-tracker..."

if [ ! -f .env ]; then
  echo "==> Generating .env with SESSION_SECRET..."
  echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
else
  echo "==> .env already exists."
fi

echo "==> Starting containers..."
if command -v docker >/dev/null 2>&1; then
  docker compose up --build -d
elif command -v podman >/dev/null 2>&1; then
  podman compose up --build -d
else
  echo "Error: Neither docker nor podman found."
  exit 1
fi

echo "==> Done! Wait a few seconds for the healthcheck to pass."
echo "==> App should be running at http://localhost:3000"
