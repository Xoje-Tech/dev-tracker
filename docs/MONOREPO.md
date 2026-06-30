# dev-tracker Monorepo Doctrine (Project Instance)

> This document is the **project-specific instance** of `~/.hermes/skills/software-development/project-doctrine/SKILL.md` §12 (Monorepo Layout, v1.2). The upstream section is the canonical contract; this file records only the project-specific overrides, decisions, and concrete state for `dev-tracker`. When the upstream section changes, reconcile this file in a follow-up change.

---

## Workspace layout

dev-tracker is a pnpm workspace rooted at the repo root. The workspace declaration is `pnpm-workspace.yaml` with `packages: ['packages/*']` (single glob — no per-package entries).

| Package | Path | Role |
|---------|------|------|
| `@dev-tracker/backend` | `packages/backend/` | HTTP transport (Express 5 + Prisma 6 + SQLite, hexagonal + screaming) |
| `@dev-tracker/frontend` | `packages/frontend/` | Browser transport (Vue 3 + Vite + Tailwind 4 + Pinia, hexagonal + atomic) |
| `@dev-tracker/client` | `packages/client/` | Core shared client (`DevTrackerClient` interface + factory + 2 impls + Zod schemas) |
| `@dev-tracker/cli` | `packages/cli/` | Terminal transport (Commander, bin `dt`) |
| `@dev-tracker/mcp` | `packages/mcp/` | Model Context Protocol server (stdio transport, 20 primitive + 3 workflow tools) |

The full five-package layout was established by the `monorepo-packages` change (see `docs/MILESTONES.md` v1.1 work and `CHANGELOG.md`). Earlier 2-package layouts (`./` + `cli/`) are obsolete; `pnpm-workspace.yaml` now uses the glob form exclusively.

## Five packages — naming and import rules

- **Cross-package imports** always go through the package name (`import { ... } from '@dev-tracker/client'`). Never relative paths that cross package boundaries. Enforced by `no-restricted-imports` in ESLint.
- **Path aliases INSIDE a package** remain specific per the doctrine (never broad). For example, inside `@dev-tracker/backend` the aliases are `@/*`, `@auth/*`, `@projects/*`, etc. — not `@dev-tracker/*`.
- **Package name** is `@{org}/{rol}`. For dev-tracker, `org = dev-tracker` and `rol` ∈ {`backend`, `frontend`, `client`, `cli`, `mcp`}.

## Hoisted singletons (NFR-1)

`@prisma/client` and `zod` are declared in the **root** `package.json` only. pnpm's `hoist=true` (default) places a single copy in `node_modules/` at the repo root. The generated Prisma client lives at the repo-root `prisma/` path; both backend code and CLI/MCP resolve it from there. No duplicate runtime, no divergent types.

`prisma/schema.prisma` and `prisma/migrations/` **stay at the repo root**. The `@dev-tracker/backend` package is the only one that runs `prisma generate`; downstream packages import types only.

## Build pipeline

- **Per-package `tsconfig.json`**: `composite: true` + `declaration: true`, extending the repo-root `tsconfig.base.json`.
- **Topological order**: `backend` and `frontend` build first (no internal deps), then `client` (depends on `backend` for in-process use cases, dev-only), then `cli` and `mcp` (both depend on `client`).
- **Root `pnpm build`**: `pnpm -r --topological build` (respects the DAG).
- **Cross-package deps**: `workspace:*` protocol (pnpm 11.x native). For example, `packages/cli/package.json` declares `"@dev-tracker/client": "workspace:*"`.

## Root scripts (post-monorepo-packages)

| Script | Command | Notes |
|--------|---------|-------|
| `dev` | `pnpm -r --parallel --filter './packages/{backend,frontend}' run dev` | Both backend and frontend start in parallel |
| `dev:client` | `pnpm -F @dev-tracker/frontend dev` | Frontend only |
| `build` | `pnpm -r --topological build` | Builds in DAG order |
| `test` | `pnpm -F @dev-tracker/backend test` | **Backend only by design** — 76 tests. Per-package: `pnpm -F <pkg> test`. This is intentional, not a typo; `pnpm test:client` runs frontend. |
| `test:client` | `pnpm -F @dev-tracker/frontend test` | Frontend only |
| `test:e2e` | `playwright test` | Playwright smoke (CLI + frontend + MCP) |
| `cli` | `pnpm -F @dev-tracker/cli start` | Runs `dt` |
| `cli:dev` | `pnpm -F @dev-tracker/cli dev` | CLI in watch mode |
| `mcp` | `pnpm -F @dev-tracker/mcp start` | Runs the MCP server (stdio) |
| `typecheck` | `pnpm -r typecheck` | Backend + frontend + client + cli + mcp |
| `db:generate` | `prisma generate` | From repo root, writes to hoisted path |
| `db:push` | `prisma db push` | Applies schema to local dev DB |

## Docker

`Dockerfile` is multi-stage: build stage runs `pnpm install --frozen-lockfile` then `pnpm -r --topological build` from the repo root, runtime stage copies `packages/backend/dist/`, `packages/frontend/dist/`, and the `prisma/` directory. The entrypoint applies pending migrations idempotently before starting the server. See `Dockerfile` and `docker-entrypoint.sh` for the current paths.

## NFRs (from the design)

- **NFR-1**: `@prisma/client` and `zod` resolve to a single hoisted copy at the repo root.
- **NFR-2**: One commit per F-step on `feature/monorepo-packages`; each commit green on its own.
- **NFR-3**: MCP tool registration order is deterministic; `tools/list` returns the same array across restarts.
- **NFR-4**: No package is published to npm. All `@dev-tracker/*` stay private.
- **NFR-5**: No SSE / WebSocket transports in the MCP server. stdio only.

## Stacked-branch delivery

`monorepo-packages` was delivered as a single feature branch `feature/monorepo-packages` with one commit per F-step (F0 → F6), then a single merge to `master`. This is a deliberate departure from chained-PR delivery; the rationale is that the work is a large refactor with 7 atomic checkpoints, and a single merge gives a clean history point.

Future refactors of similar scale may follow the same pattern when:
- The change touches > 5 files in a single move
- Each F-step can be green-tested in isolation
- The user prefers one merge over chained PRs

For small changes, default to a single PR per change — do not invent stacked-branch delivery for things that don't need it.

## See also

- `~/.hermes/skills/software-development/project-doctrine/SKILL.md` §12 — canonical monorepo doctrine
- `AGENTS.md` — agent-facing map of this repo
- `docs/MILESTONES.md` — release roadmap (v1.0 shipped 2026-06-30; v1.1 work tracked here)
- `CHANGELOG.md` — release notes
