#!/usr/bin/env bash
# scripts/backup.sh — Cron-friendly backup for dev-tracker
#
# Usage:
#   ./scripts/backup.sh                           # default: ./backups/dev-tracker-YYYYMMDD-HHMMSS.db
#   ./scripts/backup.sh --output /var/backups/dev-tracker/
#   ./scripts/backup.sh --keep 7                  # rotate: keep last 7 backups (oldest deleted)
#   ./scripts/backup.sh --compress                # gzip the output
#   ./scripts/backup.sh --container NAME          # override container name (default: dev-tracker)
#   ./scripts/backup.sh --local-path PATH         # override local dev.db path (default: ./dev.db)
#   ./scripts/backup.sh --help
#
# Behavior:
#   - Detects mode automatically: Docker container (uses sqlite3 .backup inside) OR direct (cp ./dev.db)
#   - Uses sqlite3 .backup for consistent snapshots (handles WAL mode correctly)
#   - Creates output directory if missing
#   - Lock file prevents overlapping runs (e.g., long backup during next cron tick)
#   - Exit 0 on success, 1 on failure (cron-friendly)
#
# Cron example (daily at 02:00, keep 7 days, gzip):
#   0 2 * * *  /home/hermes/projects/dev-tracker/scripts/backup.sh \
#     --output /var/backups/dev-tracker/ \
#     --keep 7 \
#     --compress \
#     >> /var/log/dev-tracker-backup.log 2>&1

set -euo pipefail

# Defaults
OUTPUT_DIR="./backups"
KEEP=0
COMPRESS=false
CONTAINER_NAME="dev-tracker"
LOCAL_PATH="./dev.db"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)    OUTPUT_DIR="$2"; shift 2 ;;
    --keep)      KEEP="$2"; shift 2 ;;
    --compress)  COMPRESS=true; shift ;;
    --container) CONTAINER_NAME="$2"; shift 2 ;;
    --local-path) LOCAL_PATH="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "[backup] ERROR: unknown option: $1 (use --help)" >&2; exit 1 ;;
  esac
done

# Lock to prevent overlapping runs
LOCK_FILE="/tmp/dev-tracker-backup.lock"
if [[ -e "$LOCK_FILE" ]]; then
  echo "[backup] Another instance is running (lock: $LOCK_FILE)" >&2
  exit 1
fi
echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Generate timestamp + output path
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="${OUTPUT_DIR}/dev-tracker-${TS}.db"

# Ensure output dir exists
if ! mkdir -p "$OUTPUT_DIR"; then
  echo "[backup] ERROR: cannot create output directory: $OUTPUT_DIR" >&2
  exit 1
fi

# Detect mode and create backup
SOURCE=""
if command -v podman &>/dev/null && podman ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  # Podman mode — sqlite3 .backup for consistency, then copy out
  echo "[backup] Mode: podman (container: $CONTAINER_NAME)"
  TMP_BACKUP_IN_CONTAINER="/app/data/.backup-${TS}.db"
  if ! podman exec "$CONTAINER_NAME" sqlite3 /app/data/dev.db ".backup '$TMP_BACKUP_IN_CONTAINER'"; then
    echo "[backup] ERROR: sqlite3 .backup failed inside container" >&2
    exit 1
  fi
  if ! podman cp "${CONTAINER_NAME}:${TMP_BACKUP_IN_CONTAINER}" "$BACKUP"; then
    echo "[backup] ERROR: podman cp failed" >&2
    exit 1
  fi
  podman exec "$CONTAINER_NAME" rm -f "$TMP_BACKUP_IN_CONTAINER" || true
  SOURCE="podman"
elif command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  # Docker mode — same as podman
  echo "[backup] Mode: docker (container: $CONTAINER_NAME)"
  TMP_BACKUP_IN_CONTAINER="/app/data/.backup-${TS}.db"
  if ! docker exec "$CONTAINER_NAME" sqlite3 /app/data/dev.db ".backup '$TMP_BACKUP_IN_CONTAINER'"; then
    echo "[backup] ERROR: sqlite3 .backup failed inside container" >&2
    exit 1
  fi
  if ! docker cp "${CONTAINER_NAME}:${TMP_BACKUP_IN_CONTAINER}" "$BACKUP"; then
    echo "[backup] ERROR: docker cp failed" >&2
    exit 1
  fi
  docker exec "$CONTAINER_NAME" rm -f "$TMP_BACKUP_IN_CONTAINER" || true
  SOURCE="docker"
elif [[ -f "$LOCAL_PATH" ]]; then
  # Direct mode (pnpm install, no container)
  echo "[backup] Mode: local (path: $LOCAL_PATH)"
  if ! cp "$LOCAL_PATH" "$BACKUP"; then
    echo "[backup] ERROR: cp from $LOCAL_PATH failed" >&2
    exit 1
  fi
  SOURCE="local"
else
  echo "[backup] ERROR: dev-tracker container '$CONTAINER_NAME' not running AND no $LOCAL_PATH found" >&2
  exit 1
fi

# Report size
SIZE=$(du -h "$BACKUP" | cut -f1)
echo "[backup] OK ($SOURCE): $BACKUP ($SIZE)"

# Optional compression
if $COMPRESS; then
  if gzip "$BACKUP"; then
    BACKUP="${BACKUP}.gz"
    SIZE=$(du -h "$BACKUP" | cut -f1)
    echo "[backup] Compressed: $BACKUP ($SIZE)"
  else
    echo "[backup] WARNING: gzip failed, keeping uncompressed" >&2
  fi
fi

# Rotation: keep last N backups
if [[ $KEEP -gt 0 ]]; then
  PATTERN="${OUTPUT_DIR}/dev-tracker-*.db"
  $COMPRESS && PATTERN="${PATTERN}.gz"
  # List files newest first, count them
  TOTAL=$(ls -1t $PATTERN 2>/dev/null | wc -l)
  if [[ $TOTAL -gt $KEEP ]]; then
    EXCESS=$((TOTAL - KEEP))
    ls -1t $PATTERN | tail -n "$EXCESS" | xargs -r rm -f
    echo "[backup] Rotated: deleted $EXCESS old backup(s), keeping $KEEP newest"
  fi
fi

echo "[backup] Done."
exit 0