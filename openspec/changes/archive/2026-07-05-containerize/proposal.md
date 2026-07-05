# Proposal: Containerizar servidor con Podman y publicar en GHCR

## Intent
Migrar el modelo de despliegue de Dev Tracker de una compilación manual en el host a un modelo de "appliance" mediante un contenedor OCI. Esto simplifica el self-hosting distribuyendo el servidor como una imagen inmutable lista para usar.

## Scope
- **Dockerfile Multistage**: Instalación de dependencias (pnpm), generación de Prisma client, compilación de Vue (frontend) y Express (backend), y extracción de artefactos de producción.
- **GitHub Actions (GHCR)**: Pipeline que construya y publique la imagen en `ghcr.io/xoje-tech/dev-tracker-server` al publicarse una Release (integrado con Release Please).
- **Setup Podman Rootless**: Creación de un `compose.yaml` (compatible con `podman-compose`) que monte un volumen persistente para la base de datos SQLite y reciba las variables de entorno.
- **Documentación**: Actualizar el `README.md` con las instrucciones precisas de despliegue usando Podman.

## Approach & Tradeoffs
- **Base Image**: Node.js 26 (siguiendo el estándar del ecosistema del proyecto).
- **Base de Datos SQLite**: Se alojará en un volumen persistente (ej. `~/.dev-tracker/data` mapeado a `/app/data` en el contenedor) para garantizar la supervivencia de los datos ante actualizaciones de la imagen. La variable `DATABASE_URL` debe apuntar a este volumen (ej. `file:/app/data/dev.db`).
- **Gestión de Entorno**: Las variables se pasarán vía `.env` con Podman Compose. (Ojo: sin comillas adicionales si hay integración con systemd, por un issue ya registrado en memoria).
- **Puerto**: Exposición en el puerto 6789 (estándar de producción del proyecto).
- **Desarrollo/Actualización**: Recomendación estricta de usar `podman-compose up -d --build` para prevenir reciclado de imágenes locales obsoletas.