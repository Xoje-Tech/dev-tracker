# Plan de Despliegue en Producción — dev-tracker
**Autor:** Gentle AI (OWL)  
**Fecha:** 8 de Julio de 2026  
**Versión del Plan:** 1.0.0  
**Estado:** PROPUESTO  

---

## 1. Introducción y Objetivo

Este documento define la arquitectura y el plan de despliegue definitivo para transformar la instalación actual de **dev-tracker** en un producto de software de producción autogestionado, seguro y altamente disponible. 

Pasamos de un contenedor que se enciende manualmente y expone puertos inseguros, a un entorno robusto compuesto por:
* **Orquestación contenerizada con Podman Compose** aislada en su propia red.
* **Reverse Proxy nativo con SSL (HTTPS) automático** usando Caddy.
* **Garantía de ciclo de vida con Systemd** a nivel de usuario para reiniciar el servicio tras fallos o reinicios de la máquina física.
* **Estrategia de backups calientes (Zero-Lock)** diarios para la base de datos de SQLite.
* **Pipeline de despliegue automatizado** en un solo script reproducible.

---

## 2. Arquitectura del Entorno

La solución utiliza una arquitectura totalmente autocontenida bajo el directorio `/home/hermes/dev-tracker-server/`. Esto evita instalar binarios extra en el sistema operativo del host (como Caddy o Nginx) y simplifica la portabilidad.

```
                  ┌─────────────────────────────────────┐
                  │           Internet / HTTPS          │
                  └──────────────────┬──────────────────┘
                                     │ Puerto 443
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Podman Compose Stack (~/dev-tracker-server/)            │
        │                                                         │
        │  ┌──────────────────────┐     Red Interna               │
        │  │ Container Caddy      │ ─────────────────────┐        │
        │  │ (SSL Automático)     │                      │        │
        │  └──────────────────────┘                      ▼        │
        │                                         ┌─────────────┐ │
        │                                         │ Container   │ │
        │                                         │ dev-tracker │ │
        │                                         │ Server      │ │
        │                                         └──────┬──────┘ │
        └────────────────────────────────────────────────│────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Volumen SQLite  │
                                                │ (./data/dev.db) │
                                                └─────────────────┘
```

### Flujo de Conexión:
1. El tráfico exterior llega por los puertos seguros `80` y `443` al contenedor de **Caddy**.
2. **Caddy** maneja automáticamente la obtención y renovación de certificados TLS (Let's Encrypt / ZeroSSL).
3. **Caddy** redirige el tráfico a través de la red interna del contenedor al puerto `3000` de `dev-tracker-server`.
4. El backend de `dev-tracker` queda completamente inaccesible desde el exterior en el puerto `6789`, cerrando vectores de ataque.

---

## 3. Fase 1: Rediseño de la Configuración de Podman Compose

Modificaremos `/home/hermes/dev-tracker-server/compose.yaml` para incluir el contenedor de **Caddy** y asegurar que `dev-tracker` no exponga puertos al host salvo de manera local (`127.0.0.1`).

### `compose.yaml` propuesto:
```yaml
services:
  dev-tracker-server:
    image: ghcr.io/xoje-tech/dev-tracker-server:latest
    expose:
      - "3000" # Expuesto solo en la red interna del stack
    ports:
      - "127.0.0.1:6789:3000" # Solo accesible localmente para el MCP / CLI de depuración
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    restart: unless-stopped

  caddy:
    image: docker.io/library/caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./caddy_data:/data
      - ./caddy_config:/config
    depends_on:
      - dev-tracker-server
```

### `Caddyfile` propuesto (en `~/dev-tracker-server/Caddyfile`):
```caddy
# Reemplazar con tu dominio real (ej. tracker.tudominio.com o IP pública)
# Si se usa localhost para pruebas locales con SSL automático de desarrollo:
localhost {
    reverse_proxy dev-tracker-server:3000
}
```

---

## 4. Fase 2: Gestión de Ciclo de Vida con Systemd (User Space)

Para asegurar que el sistema se inicie automáticamente tras un reinicio físico del host o tras una caída crítica sin requerir privilegios de `root` (lo que mantiene la seguridad del host), crearemos una unidad de servicio de systemd de usuario.

### Archivo de servicio: `~/.config/systemd/user/dev-tracker.service`
```ini
[Unit]
Description=Dev Tracker Production Stack (Podman Compose)
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/hermes/dev-tracker-server
ExecStart=/usr/bin/podman compose up -d
ExecStop=/usr/bin/podman compose down
Restart=on-failure

[Install]
WantedBy=default.target
```

### Comandos de habilitación:
```bash
# Crear directorio de servicios de usuario si no existe
mkdir -p ~/.config/systemd/user/

# Recargar daemon de systemd de usuario
systemctl --user daemon-reload

# Habilitar e iniciar el servicio
systemctl --user enable dev-tracker.service
systemctl --user start dev-tracker.service

# Asegurar que el servicio de usuario corra sin que el usuario tenga sesión SSH abierta (Linger)
sudo loginctl enable-linger hermes
```

---

## 5. Fase 3: Estrategia de Backups en Caliente (Zero-Lock)

SQLite permite realizar backups en caliente utilizando su comando de API `.backup`. Esto evita que la base de datos se bloquee para escrituras o sufra corrupción durante la copia.

Crearemos el script `~/dev-tracker-server/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

# Configuración de rutas
BACKUP_DIR="/home/hermes/dev-tracker-server/backups"
DATA_DIR="/home/hermes/dev-tracker-server/data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/dev-tracker-backup_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup de base de datos..."

# 1. Ejecutar el backup en caliente dentro del contenedor de SQLite a un archivo temporal en el volumen
/usr/bin/podman exec dev-tracker-server_dev-tracker-server_1 sqlite3 /app/data/dev.db ".backup '/app/data/backup_temp.db'"

# 2. Mover el backup temporal al directorio de resguardo histórico del host
mv "$DATA_DIR/backup_temp.db" "$BACKUP_FILE"

# 3. Eliminar backups de más de 30 días de antigüedad
find "$BACKUP_DIR" -type f -name "dev-tracker-backup_*.db" -mtime +30 -delete

echo "[$(date)] Backup finalizado con éxito: $BACKUP_FILE"
```

### Automatización con Cron:
Agendaremos el backup de forma diaria mediante la integración con el planificador local o de Hermes.
Frecuencia recomendada: Todos los días a las `03:00 AM`.

---

## 6. Fase 4: Pipeline de Actualización (Zero-Downtime Deploy)

Para actualizar el software con nuevas imágenes sin errores ni comandos manuales propensos a fallos, crearemos el script `~/dev-tracker-server/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

WORKING_DIR="/home/hermes/dev-tracker-server"
cd "$WORKING_DIR"

echo "=== [$(date)] Iniciando Pipeline de Actualización ==="

# 1. Descargar las últimas imágenes publicadas
echo "Descargando últimas imágenes..."
/usr/bin/podman compose pull

# 2. Detener e iniciar limpiamente el stack
echo "Reiniciando stack de contenedores..."
/usr/bin/podman compose down
/usr/bin/podman compose up -d

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
```

---

## 7. Plan de Ejecución y Pruebas (Checklist)

Para llevar este plan al éxito de manera segura, seguiremos estos pasos secuenciales:

* [ ] **Paso 1: Redactar los archivos en el servidor**  
  Crear los scripts de `backup.sh`, `deploy.sh`, el archivo `Caddyfile` y preparar el nuevo `compose.yaml`.
* [ ] **Paso 2: Pruebas locales de contenedores**  
  Ejecutar el despliegue manual para verificar que Caddy y `dev-tracker` se comuniquen en su red privada y expongan el puerto local `6789` correctamente.
* [ ] **Paso 3: Instalar y habilitar Systemd**  
  Crear el archivo de servicio de usuario, habilitar el "linger" en el sistema y verificar que se inicie automáticamente.
* [ ] **Paso 4: Validar el script de Backup**  
  Correr una prueba manual de `backup.sh`, verificar que genere un archivo `.db` saludable y que no corrompa el estado de la aplicación.
* [ ] **Paso 5: Programar el Cron**  
  Configurar la tarea programada diaria.

---

## 8. Conclusión

Este plan proporciona una arquitectura de calidad empresarial, adaptada a las limitaciones y herramientas actuales de tu servidor. No requiere dependencias del sistema operativo que rompan la inmutabilidad de tu entorno y garantiza la resiliencia del software ante eventos imprevistos.
