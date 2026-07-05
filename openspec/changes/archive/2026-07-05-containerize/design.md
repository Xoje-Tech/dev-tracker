# Design: Containerizar servidor con Podman y publicar en GHCR

## Architecture

El diseño se divide en tres artefactos principales:

### 1. `Dockerfile` (Multistage)
El Dockerfile optimizará el tamaño de la imagen final y aislará las herramientas de compilación.

- **`base` stage**: Define la imagen `node:26-alpine`. Habilita `corepack` (necesario para `pnpm`), establece `/app` como workdir, e instala herramientas nativas si fuesen necesarias para node-gyp (por SQLite).
- **`deps` stage**: Copia `package.json`, `pnpm-lock.yaml` e instala *todas* las dependencias (`pnpm install --frozen-lockfile`).
- **`build` stage**: Copia el resto del código y ejecuta:
  1. `pnpm exec prisma generate` (clave para que el cliente Prisma exista antes de compilar).
  2. `pnpm run build` (compila backend/frontend).
- **`runner` stage (producción)**:
  - Imagen fresca `node:26-alpine`.
  - Copia `package.json` y `pnpm-lock.yaml`, e instala solo dependencias de producción (`pnpm install --prod --frozen-lockfile`).
  - Copia el código compilado (`dist/`) desde el stage `build`.
  - Copia el directorio `prisma/` (necesario si se quiere ejecutar migraciones, aunque queda fuera de este alcance automático).
  - Copia el cliente de Prisma generado (normalmente dentro de `node_modules/.prisma` o donde esté configurado).
  - Configura `USER node` para ejecución rootless (seguridad).
  - Expone el puerto `6789`.
  - Ejecuta: `CMD ["node", "dist/server/index.js"]`.

### 2. GitHub Actions (`.github/workflows/publish-ghcr.yml`)
Pipeline de CI/CD para automatizar el release.

- **Eventos**:
  - `release: [published]` (Integración natural con Release Please).
- **Trabajos (Jobs)**:
  - `build-and-push`:
    - Ejecuta en `ubuntu-latest`.
    - Permisos: `packages: write` (para GHCR) y `contents: read`.
    - `actions/checkout@v4`.
    - `docker/setup-buildx-action@v3`.
    - `docker/login-action@v3` al registro `ghcr.io` usando `${{ secrets.GITHUB_TOKEN }}`.
    - `docker/metadata-action@v5` para extraer tags y labels desde el release de GitHub.
    - `docker/build-push-action@v5` para compilar y empujar la imagen al registro `ghcr.io/${{ github.repository_owner }}/dev-tracker-server`.

### 3. Podman Compose (`compose.yaml`)
Archivo para orquestar el despliegue local de forma declarativa.

- **Estructura**:
  ```yaml
  services:
    dev-tracker-server:
      image: ghcr.io/xoje-tech/dev-tracker-server:latest
      build: . # Permite podman-compose up --build en local
      ports:
        - "6789:6789"
      volumes:
        - ./data:/app/data
      env_file:
        - .env
      restart: unless-stopped
  ```
- **Volumen Persistente**: Mapea `./data` en el host hacia `/app/data` en el contenedor. Aquí residirá SQLite (`dev.db`).
- **Manejo de `.env`**: El usuario debe crear el `.env` con `DATABASE_URL=file:/app/data/dev.db`. (Recordatorio de diseño: sin comillas si corre con systemd).

## Tradeoffs
- **SQLite en Docker**: Usar SQLite en un contenedor requiere obligatoriamente volúmenes host. Si el contenedor se destruye, los datos se conservan. El downside es que no escala horizontalmente, pero el issue asume un despliegue "appliance" simple, lo cual encaja perfecto con SQLite.
- **Rootless**: Se fuerza la ejecución como usuario `node` en Dockerfile, pero el mapeo de permisos de volumen host (UID/GID) puede ser un pitfall común en Podman/Docker. Se asume que el host dará permisos de escritura a `./data`.