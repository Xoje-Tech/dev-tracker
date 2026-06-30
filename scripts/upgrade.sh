#!/usr/bin/env bash
# scripts/upgrade.sh
#
# Upgrade a Docker-deployed dev-tracker installation to the latest version.
#
# Usage: ./scripts/upgrade.sh [options]
#
# Options:
#   --no-backup          Skip pre-upgrade database backup
#   --skip-build         Don't rebuild the image (assume it's up-to-date)
#   --no-health-check    Don't wait for the healthcheck after restart
#   -h, --help           Show this help
#
# What it does:
#   1. Backs up the SQLite DB to ./dev-tracker-backup-<timestamp>.db (unless --no-backup)
#   2. Pulls the latest from origin/master
#   3. Rebuilds the Docker image (unless --skip-build)
#   4. Stops the running container (volume preserved)
#   5. Starts a fresh container with the new image
#   6. Waits for /api/health to return 200 (unless --no-health-check)
#
# Requirements: git, curl, and either podman or docker in PATH.
# Environment: SESSION_SECRET (or set in .env next to docker-compose.yml)

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { printf '%b[upgrade]%b %s\n' "$GREEN" "$NC" "$*"; }
warn()  { printf '%b[upgrade]%b %s\n' "$YELLOW" "$NC" "$*"; }
err()   { printf '%b[upgrade]%b %s\n' "$RED" "$NC" "$*" >&2; }
fail()  { err "$*"; exit 1; }

# ---------- Parse args ----------
BACKUP=true
SKIP_BUILD=false
SKIP_HEALTH_CHECK=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-backup)        BACKUP=false; shift ;;
    --skip-build)       SKIP_BUILD=true; shift ;;
    --no-health-check)  SKIP_HEALTH_CHECK=true; shift ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) fail "unknown option: $1 (use --help)" ;;
  esac
done

# ---------- Detect container runtime ----------
if [[ -n "${COMPOSE_CMD:-}" ]]; then
  COMPOSE="$COMPOSE_CMD"
elif command -v podman &>/dev/null; then
  COMPOSE="podman compose"
elif command -v docker &>/dev/null; then
  COMPOSE="docker compose"
else
  fail "neither podman nor docker found in PATH (install one or set COMPOSE_CMD)"
fi

# ---------- Load .env if present ----------
if [[ -z "${SESSION_SECRET:-}" ]] && [[ -f .env ]]; then
  log "loading .env"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# ---------- Pre-flight ----------
log "pre-flight checks"
git rev-parse --git-dir >/dev/null 2>&1 || fail "not in a git repository"

if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet HEAD 2>/dev/null; then
  warn "working tree has uncommitted changes"
  warn "aborting in 5s (Ctrl+C to keep them, or stash/commit first)"
  sleep 5
fi

: "${SESSION_SECRET:?SESSION_SECRET is required (export it or put it in .env)}"

log "runtime: $COMPOSE"
log ""

# ---------- 1. Backup ----------
BACKUP_FILE=""
if $BACKUP; then
  log "=== STEP 1: Pre-upgrade backup ==="
  BACKUP_FILE="dev-tracker-backup-$(date +%Y%m%d-%H%M%S).db"
  VOLUME_MOUNT="$($COMPOSE volume inspect dev-tracker-data --format '{{ .Mountpoint }}' 2>/dev/null || true)"
  if [[ -n "$VOLUME_MOUNT" ]] && [[ -f "$VOLUME_MOUNT/dev.db" ]]; then
    cp "$VOLUME_MOUNT/dev.db" "./$BACKUP_FILE"
    SIZE=$(du -h "./$BACKUP_FILE" | cut -f1)
    log "backup created: $BACKUP_FILE ($SIZE)"
  else
    warn "could not read dev.db from volume (first deploy?); skipping backup"
    BACKUP_FILE=""
  fi
fi

# ---------- 2. Git pull ----------
log ""
log "=== STEP 2: Pull latest ==="
git fetch origin
git pull --ff-only origin master || fail "git pull failed (local changes conflict? run 'git status')"

# ---------- 3. Build ----------
if ! $SKIP_BUILD; then
  log ""
  log "=== STEP 3: Rebuild image ==="
  $COMPOSE build
fi

# ---------- 4. Stop ----------
log ""
log "=== STEP 4: Stop container (volume preserved) ==="
$COMPOSE down

# ---------- 5. Start ----------
log ""
log "=== STEP 5: Start container ==="
$COMPOSE up -d

# ---------- 6. Health check ----------
if ! $SKIP_HEALTH_CHECK; then
  log ""
  log "=== STEP 6: Wait for healthcheck ==="
  READY=false
  for i in {1..60}; do
    if curl -fs http://localhost:3000/api/health >/dev/null 2>&1; then
      log "ready after ${i}s"
      READY=true
      break
    fi
    sleep 1
  done
  if ! $READY; then
    fail "container did not become healthy in 60s (check: $COMPOSE logs)"
  fi
fi

# ---------- Done ----------
log ""
log "=== Upgrade complete ==="
log "container: replaced (volume preserved)"
[[ -n "$BACKUP_FILE" ]] && log "backup:    $BACKUP_FILE" || log "backup:    skipped"