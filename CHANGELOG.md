# Changelog

All notable changes to dev-tracker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-30

First stable release. Internal deployment — not yet on a public registry.

### Highlights
- Kanban-style project management: projects, boards (4 columns: Backlog / In Progress / Review / Done), tasks, tags
- Dual auth: session cookies (browser) + API keys (CLI/scripts), sharing the same backend
- CLI tool (`dt`) for scripting and automation
- Vue 3 SPA frontend with atomic design components
- One-command Docker deployment: `docker compose up -d`
- Data persists across upgrades via named volume
- Pre-upgrade backup + automated upgrade script

### Added
- **Functional core**: projects, boards, tasks, tags modules (hexagonal backend + Vue 3 frontend)
- **Auth**: register, login, logout, session-based auth, API key rotation
- **CLI**: `pnpm cli -- auth/projects/tasks/...` commands with auto-rotate API key on first use
- **Production Docker image**: multi-stage Dockerfile (`node:26` build → `node:26-slim` runtime, non-root, healthcheck, named volume for SQLite)
- **docker-compose.yml**: one-command startup, required `SESSION_SECRET` (loud-fail if missing)
- **`scripts/upgrade.sh`**: automated upgrade with backup, git pull, image rebuild, restart, healthcheck verification
- **README**: quickstart (Docker + manual `pnpm`), config table, CLI, backup/restore, upgrade, troubleshooting
- **E2E smoke**: Playwright test covering register → login → create project → create task → drag to Done
- **Test suite**: 154 unit tests passing (backend + frontend + CLI)

### Changed
- **Node target: 26.0.0** (was 20.0.0 / 22.0.0) — canonical across all Xoje-Tech projects. Node 26 is "Current" until Oct 2026, then becomes LTS.
- **pnpm 11.9.0** as the canonical package manager (`packageManager` field pins it; corepack enforces)
- **pnpm 11 settings**: moved from `pnpm.field` in package.json to `pnpm-workspace.yaml` (`allowBuilds` map)
- **`prisma`** moved from `devDependencies` to `dependencies` — needed at runtime by the entrypoint for `db push`

### Fixed
- **TS path resolution**: `tsc-alias` added to build; `start` script fixed from `dist/server/index.js` to `dist/src/server/index.js`
- **SPA fallback**: `src/app.ts` now serves `dist/client/index.html` for non-API routes (previously returned `{"error":"Not found"}`)
- **Session persistence**: `connect-sqlite3` sessions.db was at `/app/sessions.db` (lost on restart); now lives in the named volume via `SESSIONS_DIR=/app/data`
- **Data persistence**: `DATABASE_URL: file:./data/dev.db` was resolved relative to schema.prisma dir (baked into image!) — fixed to absolute path `file:/app/data/dev.db`
- **`pnpm prune` in Docker**: needed `CI=true` to avoid TTY prompt
- **`corepack enable`** in `node:26` image — added `npm install -g corepack@latest` first
- **F4 auth polish**: 9 fixes across frontend/CLI/backend (session-expired banner, invalid-credentials UX, 401 discrimination, etc.)

### Security
- Helmet middleware (CSP, HSTS, X-Frame-Options, etc.)
- `httpOnly` cookies, `secure` in production (HTTPS required)
- bcryptjs password hashing
- Prisma parameterized queries (no SQL injection surface)
- `SESSION_SECRET` validation: minimum 16 chars, must be set explicitly in production

### Technical Notes
- **Internal-only deployment**: not pushed to a public registry. Q1 (CI → ghcr.io) is deferred until after v1.0 ships.
- **No migration path needed**: this is the first tagged release; 0.x.y commits are pre-1.0 WIP.
- **Upgrade path from 0.x**: no upgrade script exists (only `upgrade.sh` for same-version or future versions). 0.x → 1.0 is a fresh install.

### Deferred (not in v1.0)
- TUI installer wizard → v1.1
- systemd unit / launchd plist → v1.2
- SEA binary distribution → v2.0
- Q1 (CI → ghcr.io on `v*` tags) → post-v1.0

## [0.x] - Pre-release history

The 0.x line was iterative WIP. Key milestones during this phase:
- Initial project scaffold (TypeScript, Express, Prisma, Vue 3, Vite, Tailwind 4)
- Hexagonal backend reorganization
- CLI scaffolding
- Auth polish (F4)
- E2E smoke test (F2)
- Production build verification (F3)
- Docker support (D1+D2+D3)
- Cross-project Node 26 migration

These are not individually tagged — see `git log --oneline` for the commit-by-commit history.