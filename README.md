# dev-tracker

Self-hosted Kanban-style project management — REST API + Vue 3 SPA + CLI, backed by SQLite.

Single-container Docker deployment. ~30 seconds from `git clone` to running app.

## Features

- **Projects & boards** — multiple projects per user, auto-created default board with 4 columns (Backlog / In Progress / Review / Done)
- **Tasks** — create, update, move between columns, assign priority and tags
- **Dual auth** — session cookies (browser) + API keys (CLI/scripts) with shared backend
- **CLI** — `dt` binary for scripting and automation (`pnpm cli`)
- **SQLite** — single-file database, easy backup, no external dependencies
- **Production-tested** — Playwright E2E smoke test covers the full happy path

## Stack

- **Backend:** Node.js 26 + TypeScript 5 + Express 5 + Prisma 6 + SQLite
- **Frontend:** Vue 3 + Vite + Tailwind CSS 4 + Pinia + vue-router 4 + vue-draggable-plus
- **CLI:** Commander.js, built and bundled as `dt`
- **Auth:** Dual — session cookies (browser) + API key (programmatic)

## Quickstart (Docker)

Requires [Docker](https://docs.docker.com/get-docker/) 20.10+ and [Docker Compose](https://docs.docker.com/compose/install/) v2.

```bash
# 1. Generate a session secret (one-time, persists across restarts via .env)
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env

# 2. Build and start
docker compose up -d

# 3. Verify
curl http://localhost:3000/api/health
# → {"status":"ok",...}

# 4. Open the app
xdg-open http://localhost:3000     # Linux
open http://localhost:3000         # macOS
```

First boot takes ~30s (image build + dependency install + Prisma schema push). Subsequent boots: ~2s.

## Quickstart (manual, no Docker)

Requires Node.js 26+ (use [mise](https://mise.jdx.dev/), [fnm](https://github.com/Schniz/fnm), or [nvm](https://github.com/nvm-sh/nvm)) and pnpm 11+.

```bash
# 1. Install
pnpm install

# 2. Set up database (one-time)
pnpm db:generate
pnpm db:push

# 3. Build
pnpm build

# 4. Start
SESSION_SECRET=$(openssl rand -hex 32) pnpm start
```

For development with hot reload:

```bash
pnpm dev   # backend on :3000 with watch mode
# in another shell:
pnpm dev:client   # Vite dev server on :5173 (proxies /api to :3000)
```

## Configuration

All configuration via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `3000` | HTTP port |
| `DATABASE_URL` | `file:./dev.db` | SQLite database file path |
| `SESSION_SECRET` | *(required in production)* | Long random string for session signing. Generate with `openssl rand -hex 32` |

For Docker, set `SESSION_SECRET` in a `.env` file next to `docker-compose.yml`. The `${SESSION_SECRET:?...}` syntax in compose will fail loudly if it's missing.

## CLI

The `dt` CLI talks to a running dev-tracker instance via the REST API using API-key auth.

```bash
# One-time setup (auto-rotates an API key and stores it in ~/.dev-tracker/session.json)
pnpm cli -- auth register --email you@example.com --password 'pick-a-good-one' --name "Your Name"

# Now use it
pnpm cli -- projects list
pnpm cli -- tasks create --column <col-id> --title "Do the thing" --priority high
pnpm cli -- auth me   # show current user + auth mode
```

The CLI auto-detects `localhost:3000` by default. For a remote instance:

```bash
DEV_TRACKER_URL=https://dev-tracker.internal:3000 pnpm cli -- projects list
```

## Backup & restore

The SQLite database is the only stateful artifact. It lives at `/app/data/dev.db` inside the container, persisted in the `dev-tracker-data` named volume.

**Manual backup (one-shot):**

```bash
# Backup to current directory with date stamp
docker run --rm \
  -v dev-tracker-data:/data \
  -v $(pwd):/backup \
  alpine cp /data/dev.db /backup/dev-tracker-$(date +%F).db
```

**Restore:**

```bash
# Stop the running container
docker compose down

# Restore (WARNING: overwrites current DB)
docker run --rm \
  -v dev-tracker-data:/data \
  -v $(pwd):/backup \
  alpine cp /backup/dev-tracker-2026-06-30.db /data/dev.db

# Start again
docker compose up -d
```

**Scheduled backups (cron example):**

```cron
# /etc/cron.d/dev-tracker-backup — daily at 02:00
0 2 * * *  root  docker run --rm -v dev-tracker-data:/data -v /var/backups/dev-tracker:/backup alpine cp /data/dev.db /backup/dev-tracker-$(date +\%F).db
```

## Upgrade

```bash
git pull
docker compose build
docker compose up -d
```

The named volume (`dev-tracker-data`) persists across upgrades — **your data is safe**. The schema is migrated automatically by the entrypoint script (`prisma db push` is idempotent for SQLite).

For breaking changes, check [CHANGELOG.md](./CHANGELOG.md) first.

## Development

### Project structure

```
dev-tracker/
├── prisma/                 # Prisma schema + migrations
├── src/
│   ├── server/index.ts    # Backend entry
│   ├── app.ts             # Express composition root
│   ├── config/env.ts      # Zod-validated env vars
│   ├── prisma.ts          # Prisma client singleton
│   ├── modules/           # Hexagonal backend (auth, projects, board, tasks, tags, shared)
│   └── client/            # Vue 3 frontend (modules + atomic design components)
├── cli/                   # dt CLI (Commander.js + bundled dist)
├── tests/                 # Vitest suites (backend + E2E with Playwright)
├── docs/                  # Project docs (roadmap, runbook)
├── Dockerfile
├── docker-compose.yml
└── AGENTS.md              # AI agent guide
```

### Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Backend with hot reload (tsx watch) |
| `pnpm dev:client` | Vite dev server for frontend |
| `pnpm build` | Compile TypeScript + bundle frontend (`tsc && tsc-alias && vite build`) |
| `pnpm start` | Run compiled production bundle |
| `pnpm test` | Run all unit tests once |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:e2e` | Playwright smoke test (requires chromium installed) |
| `pnpm typecheck` | TypeScript validation, no emit |
| `pnpm lint` | ESLint on `src/` |
| `pnpm format` | Prettier write |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Apply schema to SQLite (dev) |
| `pnpm db:studio` | Prisma Studio GUI |
| `pnpm cli -- <args>` | Run CLI (built) |
| `pnpm cli:dev -- <args>` | Run CLI (tsx mode, no build) |

See [AGENTS.md](./AGENTS.md) for the full agent guide (architecture, conventions, known gaps).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `SESSION_SECRET is required` on startup | `.env` missing or `SESSION_SECRET` unset | `echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env` |
| `port 3000 is already allocated` | Another process owns the port | `lsof -i :3000` to find it; stop it or change `PORT` in compose |
| `EACCES` on `/app/data` | Volume permissions | `docker compose down && docker volume rm dev-tracker-data && docker compose up -d` |
| `SQLITE_BUSY` errors | Another process holds the DB lock | Stop any direct `dev.db` access; container should be the only writer |
| `prisma db push` fails | Schema drift | `pnpm db:generate` then retry; or restore from backup |
| Healthcheck stays `unhealthy` | Server crash on boot | `docker compose logs dev-tracker` for details |

For deeper debugging, see [docs/RUNBOOK.md](./docs/RUNBOOK.md) (TBD — `Q3` milestone).

## License

Internal use only. Not published to a public registry without explicit approval.