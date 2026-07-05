#!/usr/bin/env bash
set -e

# Nota: El Issue 1 (repoUrl) ya fue creado exitosamente como Issue #8.
# Este script crea los issues restantes del backlog.

echo "Creando Issue 2: Script de instalación global..."
gh issue create --title "Crear script de instalación global para el CLI (curl-to-bash)" --body "**Descripción:**
Desacoplar el uso del CLI (\`dt\`) del repositorio de código local. Permitir que cualquier desarrollador instale y use el CLI desde cualquier directorio mediante un script de instalación de una sola línea (patrón curl-to-bash).

**Criterios de Aceptación / Impacto Técnico:**
- **Script Bootstrap:** Crear un archivo \`install.sh\` que detecte el OS/Arquitectura y decida cómo instalar el binario.
- **Distribución:** Empaquetar el CLI (vía \`pkg\`, \`esbuild\` o publicándolo en un registro de npm) para que pueda descargarse/instalarse sin clonar el monorepo.
- **Modificación del PATH:** El script de instalación debe colocar el ejecutable \`dt\` en un directorio accesible (ej. \`~/.dev-tracker/bin\`) y ofrecer/automatizar la modificación del \`.bashrc\` o \`.zshrc\`."

echo "Creando Issue 3: Servidor MCP nativo..."
gh issue create --title "Implementar Servidor MCP (Model Context Protocol) nativo" --body "**Descripción:**
Construir el \"andén de carga\" para la IA. Exponer la lógica de negocio de dev-tracker a través del protocolo estándar MCP, permitiendo que agentes (como Claude, Hermes, etc.) consuman las herramientas de forma nativa sin interactuar con la terminal ni parsear strings.

**Criterios de Aceptación / Impacto Técnico:**
- **Servidor:** Implementar el servidor MCP (ej. usando \`@modelcontextprotocol/sdk\`).
- **Tools:** Exponer operaciones core como tools tipadas: \`list_projects\`, \`create_task\`, \`move_task\`, \`create_project\`.
- **Autenticación:** Proveer un mecanismo seguro para que el servidor MCP se autentique contra la base de datos o el backend interno (vía API keys existentes)."

echo "Creando Issue 4: Blindaje del CLI..."
gh issue create --title "Blindaje del CLI para consumo automatizado (Machine-to-Machine)" --body "**Descripción:**
Garantizar que el CLI existente no rompa los parsers de los agentes cuando se usa en pipelines (CI/CD) o cuando el servidor MCP no esté disponible.

**Criterios de Aceptación / Impacto Técnico:**
- **Modo Estricto:** Asegurar que la flag \`--json\` silencie de forma absoluta todo output humano (spinners, logs, warnings) volcándolo a \`stderr\` o suprimiéndolo, dejando \`stdout\` 100% puro para JSON.
- **Auto-detección:** Si \`process.stdout.isTTY\` es falso (ej. corriendo dentro de un sub-proceso de IA o script), activar automáticamente el modo JSON.
- **Manejo de Errores:** Envolver excepciones no capturadas en sobres JSON estructurados (ej. \`{\"error\": \"Unauthorized\", \"code\": 401}\`) en lugar de stack traces de texto plano."

echo "Creando Issue 5: Búsqueda Semántica..."
gh issue create --title "Búsqueda Semántica y Persistencia AI-Native (Embeddings)" --body "**Descripción:**
Evolucionar la capa de persistencia para soportar consultas por significado (semántica) en lugar de depender exclusivamente de consultas SQL rígidas. Permitir que el sistema responda a conceptos abstractos como \"proyectos grandes\" o \"tareas bloqueadas por falta de definición\" sin necesidad de programar heurísticas deterministas para cada caso.

**Criterios de Aceptación / Impacto Técnico:**
- **Generación de Embeddings:** Integrar un modelo de embeddings (ej. OpenAI \`text-embedding-3-small\` o un modelo local) para vectorizar la metadata de proyectos y tareas al crearse o actualizarse.
- **Almacenamiento Vectorial:** Extender la base de datos actual (ej. usando \`sqlite-vss\` si es SQLite, o \`pgvector\` si se migra a PostgreSQL) para almacenar los vectores de los modelos Prisma.
- **Endpoint de Búsqueda Semántica:** Crear un endpoint (y exponerlo vía MCP y CLI) que acepte consultas en lenguaje natural, genere el vector de la consulta, y devuelva los registros más cercanos mediante similitud del coseno."

echo "¡Issues 2 al 5 creados con éxito!"
