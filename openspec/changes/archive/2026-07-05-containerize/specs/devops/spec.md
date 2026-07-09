# Spec: Containerizar servidor con Podman y publicar en GHCR

## Requirements

### 1. Dockerfile Multistage
- **Base Image**: `node:26-alpine` (para reducir superficie de ataque y tamaño).
- **Stage 1 (deps)**: Instalar dependencias usando `pnpm` (activando corepack). 
- **Stage 2 (builder)**: Copiar código fuente, generar Prisma Client (`pnpm exec prisma generate`), y compilar el backend (`pnpm build`) y frontend (si aplica a esta misma imagen).
- **Stage 3 (production)**: Copiar solo `node_modules` de producción, el Prisma Client generado, y el build.
- **Run**: Comando de inicio: `node dist/server/index.js` (o equivalente compilado).
- **Seguridad**: Ejecutar como usuario no-root (`node`).

### 2. GitHub Actions (GHCR)
- **Trigger**: Ejecutar on `release: [published]`.
- **Permissions**: `packages: write`, `contents: read`.
- **Steps**:
  - Checkout del código.
  - Setup de Docker Buildx (o Podman).
  - Login a GHCR (`ghcr.io`) con `${{ secrets.GITHUB_TOKEN }}`.
  - Obtener meta tags con `docker/metadata-action` para versionar la imagen.
  - Build y Push de la imagen OCI a `ghcr.io/xoje-tech/dev-tracker-server`.

### 3. Podman Compose (Rootless)
- **Archivo**: `compose.yaml` (o `docker-compose.yml` estándar compatible).
- **Servicio**: `dev-tracker-server`.
- **Volúmenes**:
  - Montar volumen local `./data` (o `~/.dev-tracker/data`) a `/app/data` en el contenedor.
- **Entorno**: Cargar variables desde archivo `.env`. (Evitar uso de comillas adicionales).
- **Puertos**: Mapear el `6789:6789`.

### 4. Documentación
- Actualizar el `README.md`.
- Instrucciones para crear el archivo `.env`.
- Comando para iniciar: `podman-compose up -d --build`.

## Out of Scope
- Migración de base de datos automatizada dentro del contenedor en tiempo de arranque (requerirá un script de entrypoint, pero mantendremos Prisma db push o migrate deploy explícito o vía volumen pre-creado si no se define en el issue). Asumiremos que Prisma ejecutará `migrate deploy` en el startup script o se documentará la creación inicial. Para simplificar, el contenedor debe poder arrancar con la base SQLite y conectarse a ella.
