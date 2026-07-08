#!/bin/bash
set -e

WORKING_DIR="$HOME/dev-tracker-server"
cd "$WORKING_DIR"

echo "=== [$(date)] Iniciando Pipeline de Actualización ==="

# 1. Descargar las últimas imágenes publicadas
echo "Descargando últimas imágenes..."
podman compose pull

# 2. Detener e iniciar limpiamente el stack
echo "Reiniciando stack de contenedores..."
podman compose down
podman compose up -d

# 3. Verificar salud del servicio localmente
echo "Verificando salud de la API..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:6789/api/health || echo "000")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "=== Despliegue exitoso! API respondiendo HTTP 200 ==="
else
    echo "=== ALERTA: Fallo de verificación de salud de la API (HTTP $HTTP_STATUS) ==="
    exit 1
fi
