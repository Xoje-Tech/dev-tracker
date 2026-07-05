# Tasks: Containerizar servidor con Podman y publicar en GHCR

## F-Tasks (Implementation Steps)

- [ ] **F-Task 1**: Crear `Dockerfile` en la raíz.
  - Implementar multistage build: `base` (node:26-alpine), `deps` (pnpm install), `build` (prisma generate, pnpm build), `runner` (producción, rootless user `node`).
- [ ] **F-Task 2**: Crear `compose.yaml` en la raíz.
  - Definir servicio `dev-tracker-server`.
  - Mapear puerto 6789 y volumen `./data:/app/data`.
  - Configurar `env_file: .env`.
- [ ] **F-Task 3**: Crear workflow de GitHub Actions en `.github/workflows/publish-ghcr.yml`.
  - Trigger en `release: [published]`.
  - Jobs de build, autenticación en GHCR y push usando `docker/build-push-action@v5`.
- [ ] **F-Task 4**: Actualizar `README.md`.
  - Agregar sección "Deployment con Podman".
  - Incluir comandos `podman-compose up -d --build` y configuración del `.env`.

## Review Workload Forecast

- **Estimated changed lines:** ~120
- **400-line budget risk:** Low
- **Decision needed before apply:** No
- **Chained PRs recommended:** No
