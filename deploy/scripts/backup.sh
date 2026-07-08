#!/bin/bash
set -e

# Configuración de rutas (genérico usando $HOME)
BACKUP_DIR="$HOME/dev-tracker-server/backups"
DB_FILE="$HOME/dev-tracker-server/data/dev.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/dev-tracker-backup_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup en caliente de SQLite..."

# Realizar backup usando el binario sqlite3 del host de forma segura y sin bloqueos
sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"

# Limpieza: borrar backups con más de 30 días de antigüedad
find "$BACKUP_DIR" -type f -name "dev-tracker-backup_*.db" -mtime +30 -delete

echo "[$(date)] Backup finalizado con éxito: $BACKUP_FILE"
