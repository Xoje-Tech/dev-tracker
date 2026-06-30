# dev-tracker v1.0 Milestones

> **Scope decision (2026-06-30):** v1.0 targets **internal use** (single user +
> small team). Distribution path is **Docker** as the primary install method,
> with a manual `pnpm` path as secondary. A TUI installer wizard and systemd
> integration are **explicitly deferred** to v1.1+ — they only make sense if
> external users appear or if Docker becomes a blocker for someone.

The v1.0 definition of done is:

> _Se instala en un comando, se actualiza en tres._

```bash
# Install
docker run -d --name dev-tracker -p 3000:3000 -v dev-tracker-data:/app/data \
  ghcr.io/xoje-tech/dev-tracker:1.0.0

# Upgrade
docker pull ghcr.io/xoje-tech/dev-tracker:1.1.0
docker stop dev-tracker && docker rm dev-tracker
docker run -d --name dev-tracker -p 3000:3000 -v dev-tracker-data:/app/data \
  ghcr.io/xoje-tech/dev-tracker:1.1.0
# (named volume persists SQLite — zero data loss)
```

---

## Functional (what the app does)

- [ ] **F1.** All 6 backend modules (`auth`, `projects`, `board`, `tasks`, `tags`, `shared`) + 5 frontend modules (`shared`, `auth`, `projects`, `board`, `tags`) stable
- [ ] **F2.** E2E smoke test covering: login → create project → init board → create task → move task → mark done
- [ ] **F3.** Production build verified — `pnpm build && pnpm start` runs the compiled bundle (frontend assets from `dist/client/`, backend from `dist/server/`), not dev mode
- [ ] **F4.** Auth flow polished — session recovery on reload, graceful handling of expired API key (clear error + path to `dt auth rotate-key`)

## Distribution (how it's delivered)

- [ ] **D1.** Multi-stage `Dockerfile`
  - Build stage: `node:20` (full toolchain for `pnpm build`)
  - Runtime stage: `node:20-slim`
  - Non-root user (`USER node` or dedicated `devtracker`)
  - `HEALTHCHECK` pointing at `/api/health`
  - Bundles both `dist/server/` and `dist/client/`
- [ ] **D2.** `docker-compose.yml` with named volume (`dev-tracker-data:/app/data`) so SQLite survives container replacement
- [ ] **D3.** `README.md` quickstart — Docker path (5 min) + manual `pnpm` path for purists
- [ ] **D4.** Upgrade automation — `scripts/upgrade.sh` or `pnpm upgrade` runs: `git pull && pnpm install && pnpm db:push && pnpm build && pm2 restart` (or equivalent process manager hook)
- [ ] **D5.** `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) + documented semver policy (`MAJOR` = breaking API/DB schema, `MINOR` = features, `PATCH` = fixes)

## Quality (is it solid)

- [ ] **Q1.** CI workflow (`.github/workflows/release.yml`) — on `v*` tag push: install deps → typecheck → tests → build → push image to `ghcr.io/xoje-tech/dev-tracker`
- [ ] **Q2.** Backup script — `scripts/backup.sh` (cron-friendly), copies `prisma/dev.db` (or `/app/data/dev.db` in container) to a configurable destination with rotation (keep last N)
- [ ] **Q3.** Troubleshooting runbook in `README.md` or `docs/RUNBOOK.md` — covers at minimum: port 3000 in use, SQLite locked, Prisma migration drift, session cookie vs API key confusion, container can't reach host DB

---

## Out of scope for v1.0 (do not start)

These were considered and **deferred** to keep v1.0 focused on the core install/upgrade story:

| Deferred | When | Why now? |
|---|---|---|
| TUI installer wizard (`dt setup`, `dt upgrade`) | v1.1 | Only if real users complain that Docker is a blocker |
| `systemd` unit / `launchd` plist | v1.2 | Only for users who refuse Docker AND need auto-restart on boot |
| Standalone SEA binary (Node Single Executable Application) | v2.0 | Only if dev-tracker becomes a public product |
| Multi-tenant support (orgs, RBAC) | v2.0+ | Internal scope doesn't need it |
| Mobile / PWA frontend | v2.0+ | Web works fine for internal use |

---

## Active sprint (2026-06-30 → v1.0)

**Strategy decision:** Q1 (CI → ghcr.io) is **deferred until v1.0 ships**.
Rationale: do not spend pipeline budget on a repo that hasn't reached its
first stable release. After v1.0 is tagged, escalate `workflows:write`
permission on the Gandalf-Xoje GitHub App (ID 4136988) and unblock Q1.

**Sprint order:** B first (functional polish), then revisit D (distribution).
This keeps the core feature stable before we ship the packaging.

| Order | Item | Status | Why this slot |
|-------|------|--------|---------------|
| 1 | **F4** Auth polish | ✅ **DONE 2026-06-30** | 9 fixes across frontend/CLI/backend; 154 tests passing |
| 2 | **F2** E2E smoke (Playwright) | ✅ **DONE 2026-06-30** | Chromium-only smoke (register → create project → create task → drag to Done), 788ms; 3 pre-existing build bugs fixed in the process |
| 3 | F3 Production build verified | ✅ **DONE 2026-06-30** | `pnpm build && pnpm start` runs compiled bundle (`dist/src/server/` + `dist/client/`); SPA fallback at `src/app.ts:149-153`; E2E smoke is the live proof (3x green) |
| 4 | D1+D2+D3 Docker + README | ✅ **DONE 2026-06-30** | Multi-stage Dockerfile (`node:26` → `node:26-slim`), docker-compose with named volume, comprehensive README; compose syntax validated; build verification blocked on docker.sock perms |
| 5 | D4 Upgrade script | queued | Trivial once D1+D2 exist |
| 6 | D5 CHANGELOG + semver | queued | Trivial, write at release time |
| 7 | Q2 Backup script | queued | The README has a manual backup procedure, but a cron script is the next step |
| 8 | Q3 Troubleshooting runbook | queued | The README has a basic matrix; a full runbook (`docs/RUNBOOK.md`) is the next step |
| 9 | Q1 CI → ghcr.io | ⛔ BLOCKED | Defer to post-v1.0 (see strategy) |

### D1+D2+D3 delivered (2026-06-30)

**Files:**
- `Dockerfile` (65 LOC) — multi-stage `node:26` build → `node:26-slim` runtime, non-root, healthcheck, entrypoint
- `docker-compose.yml` (28 LOC) — port 3000:3000, named volume `dev-tracker-data`, required SESSION_SECRET
- `docker-entrypoint.sh` (15 LOC) — applies Prisma schema idempotently before server start
- `.dockerignore` (39 LOC) — excludes node_modules, dist, tests, dev DBs, secrets
- `README.md` (212 LOC) — quickstart (Docker + manual), config table, CLI, backup/restore, upgrade, troubleshooting

**Verified:** `docker compose config` validates syntax clean.
**Blocked:** `docker compose build` not run locally — Docker socket permissions (`/var/run/docker.sock`) require user to be in `docker` group. Run `docker compose build` in your environment to confirm image builds.

### F4 delivered (2026-06-30)

**Bugs fixed:**
- `cli/src/commands/auth.ts` — `"***"` literal replaced with `"cookie"` (login L91, register L150)
- `useApi.buildError` — falls back to `body.error` when `body.message` absent (matches CLI)
- `auth.fetchMe` — discriminates 401 (`expired`) vs network errors (`network`) vs 4xx (`auth_error`)
- `persistUserWithApiKey` — no longer silently swallows rotate failure (stderr warning)

**UX improvements:**
- `LoginBanner.vue` (new molecule) — renders different copy for `session_expired` vs `invalid_credentials`
- `auth-guard` — appends `?reason=session_expired` on 401-driven redirects
- `main.ts` — bootstraps `fetchMe()` after mount (fixes deep-link race)
- CLI `ApiClient` — 401 emits `Try: dt auth rotate-key` (text) + `{hint, code: "API_KEY_REVOKED"}` (JSON)

**Backend cleanup:**
- `/api/auth/me` returns full `authResponseDtoSchema` shape (incl. `apiKey`) via `toAuthResponseDto()`
- `AuthUser` type extended with `apiKey`; `buildAuthStrategy()` populates both session + API-key paths

**Test coverage added:** 19 tests (9 frontend, 7 CLI, 3 backend integration via supertest).
**Working tree:** dirty with 13 modified + 7 new files. No commit made yet.

## Progress tracking

Update this file (check the boxes) as items land. Move completed sections to a
`## Released in v1.0.0` block at the top when the version ships.

For cross-session continuity, the canonical state of these milestones also lives
in Engram under topic `projects/dev-tracker/v1-milestones`.