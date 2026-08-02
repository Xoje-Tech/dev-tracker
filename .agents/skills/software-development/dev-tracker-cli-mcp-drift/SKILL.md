---
name: dev-tracker-cli-mcp-drift
description: >
  The dev-tracker MCP server (`mcp_dev_tracker_*` tools) and the
  `dt` CLI sometimes lie or return errors that look like bugs but
  are actually surface drift from the real backend. Load this when
  an MCP call returns 404 on a route you KNOW exists, when the CLI
  is missing from `PATH`, when MCP tools you need (update, archive,
  list_sprints) are absent, when the backend returns 500 with
  `P2021`/`P2025` Prisma codes, or when the deploy is running an
  older image than the source code in `~/projects/dev-tracker`. The
  diagnostic ladder below reaches truth in 5–10 minutes.
version: 1.0.0
license: Apache-2.0
metadata:
  hermes:
    tags: [dev-tracker, mcp, drift, diagnosis, prisma]
    related_skills: [dev-tracker-cli, debug-claim-vs-evidence, mcp-server-debugging]
---

# dev-tracker-cli-mcp-drift

The MCP server (`dist/src/mcp/index.js`) and the `dt` CLI are thin
wrappers over the dev-tracker REST API at `localhost:6789/api`. Both
can return errors that point at the wrong layer:

- **MCP** calls routes that no longer exist on the deployed backend
  (drift between the MCP `tools.ts` URL list and the backend's actual
  route constants).
- **CLI** may be missing from `PATH` or pinned to a stale version that
  doesn't know newer commands (`dt doctor`, `dt version`, `dt update-all`).
- **Backend** may be running an older image than the source tree in
  `~/projects/dev-tracker`, so what your memory says the backend does
  is not what the live container does.

This skill captures the diagnostic ladder for "I asked the MCP for X
and it broke — is it me, the MCP, the CLI, or the backend?".

## Iron rule

```text
When MCP errors don't make sense, do NOT trust the MCP. Go to the
backend directly with curl, and verify against the source code's
route constants BEFORE forming a hypothesis.
```

## Diagnostic ladder (5 steps, ~5–10 minutes)

### Step 1 — Identify which surface failed

The error message tells you which surface is in play:

| Error you see | Surface | Where to look next |
|---|---|---|
| `mcp_dev_tracker_*` tool returns `Not found` or `Internal server error` | MCP server | Step 2 |
| `dt: command not found` | CLI missing | Step 3 |
| `dt` returns `Error: fetch failed` | CLI → backend URL | Use `references/cli-default-port-drift.md` |
| `curl http://localhost:6789/api/...` returns 500 with `code: P2021`/`P2025` | Backend Prisma | Step 4 |
| `curl http://localhost:6789/api/...` returns 200 with sane JSON | Backend OK; upstream surface is the problem | Step 5 |

### Step 2 — Verify what MCP actually calls

Read `~/projects/dev-tracker/src/mcp/tools.ts`. The `executeTool`
function is a switch statement where every tool name maps to a
`client.get(...)` / `client.post(...)` / `client.patch(...)` / `client.delete(...)`
call. The URL in that call is the URL the MCP hits.

Compare against the backend's actual route constants:

```bash
# Find all route constants
grep -rn "ROUTES\s*=" ~/projects/dev-tracker/src/modules/*/domain/routes.ts

# Find what app.ts mounts
grep -nE "app\.use\(" ~/projects/dev-tracker/src/app.ts
```

**Common drift observed**:

- MCP `get_project_board` calls `/projects/:id/board` → backend mounts
  the board router under `/api/boards` with `:projectId` segment, so
  the real URL is `/api/boards/:projectId/board`. Result: MCP 404.
- MCP `list_sprints` calls `/projects/:id/sprints` → matches if the
  sprint router is mounted (PR B/C/D of `roadmap-and-sprints`). If
  those PRs aren't merged into the deployed branch, the route doesn't
  exist on the running container — backend 500.

**Action**: if the MCP URL doesn't match the route constant, the bug
is in the MCP, not the backend. Use direct REST (Step 5) until the
MCP is rebuilt against current source.

### Step 3 — Verify the CLI exists and matches the source

```bash
which dt
dt --version       # if missing, the CLI was never installed or got purged
```

- If `which dt` is empty → CLI not installed. Use `pnpm cli:dev` from
  `~/projects/dev-tracker` (no build step) or direct REST.
- If `dt --version` is very stale (e.g., `0.1.0` when source is `1.2.x`)
  → the self-update never fired (known issue with release-please URL
  pattern change). Use `dt update --yes` or fall back to REST.

### Step 4 — Read the running container's logs

When the backend returns 500, the Prisma error code is in the
container logs:

```bash
cd ~/dev-tracker-server
podman compose logs --tail 50 dev-tracker-server
```

Look for:

- `PrismaClientKnownRequestError` → table missing (P2021) or row
  not found (P2025) or constraint violation (P2002/P2003). The error
  message names the model (`Milestone`, `Sprint`, etc.).
- `code: 'P2021', meta: { modelName: 'Milestone', table: 'main.Milestone' }`
  → the deploy is missing a migration. Apply the schema directly from the development repository to the container's sqlite database file to recover immediately without needing a full image rebuild:
  ```bash
  DATABASE_URL="file:/home/hermes/dev-tracker-server/data/dev.db" pnpm --dir /home/hermes/projects/dev-tracker db:push
  ```
  This is extremely safe and backwards-compatible for SQLite, adding missing tables like `Sprint` and `Milestone` instantly and restoring MCP functionalities (e.g. `list_sprints`, `list_milestones`) which would otherwise return 500.
- `code: 'P2025'` → reference to a non-existent row (cascade bug or
  data inconsistency). Investigate the use case that produced it.

**This is the most common bug in dev-tracker right now (2026-07-21)**:
the `roadmap-and-sprints` SDD ships modules in stacked PRs (A/B/C/D).
The production image is rebuilt from `master` after each PR merges.
If you see `P2021` for `Milestone` or `Sprint`, it means PR B/C/D is
not yet on `master` — the MCP and CLI expose routes for modules the
deployed backend doesn't have.

### Step 5 — Bypass MCP/CLI, hit the backend directly

The API key lives in `~/.dev-tracker/session.json` after a successful
`dt auth login` (or `auth register`):

```bash
API_KEY=$(jq -r .apiKey ~/.dev-tracker/session.json)
BASE="http://localhost:6789/api"

# Test the route you actually need
curl -s -H "x-api-key: $API_KEY" "$BASE/projects/<project-id>/board" | jq .
```

If this works and the MCP call to the same resource fails, the bug
is in the MCP URL mapping (Step 2). If this also 500s, the bug is in
the backend (Step 4). If this 404s, find the correct route from
`app.ts` mounts + per-module `routes.ts` constants.

## Quick sanity probes (run before any deep dive)

```bash
# Is the container running?
podman ps --filter name=dev-tracker
# → if empty, server isn't up: systemctl --user start dev-tracker

# Is the API reachable?
curl -sI http://localhost:6789/health   # → 200 OK

# Does the API key work?
curl -s -H "x-api-key: $(jq -r .apiKey ~/.dev-tracker/session.json)" \
  http://localhost:6789/api/projects | jq '. | length'
# → should be > 0 (number of projects)
```

If any of these fails, fix the upstream layer before chasing the
MCP/CLI symptom.

## When to give up on the surface and use REST directly

Use direct REST (`curl -H "x-api-key: ..."`) when:

- The MCP URL mapping is drifted (Step 2 confirmed).
- The CLI is missing or too old (Step 3 confirmed).
- The backend has unmerged modules exposing new routes (Step 4).
- You're doing read-only state inspection (board, project list,
  sprint list, milestone list) — REST is faster than launching a
  subprocess.

Use the MCP only when the operation matches a tool the MCP server
actually exposes correctly (currently: `list_projects`, `get_project_board`,
`create_project`, `create_task`, `move_task` — and the latter two have
their own gotchas documented in the parent `dev-tracker-cli` skill).

## Pitfalls

- **Don't trust the MCP's error message as the bug location.** The
  MCP can return `Not found` for a route that DOES exist on the
  backend — the MCP is calling the wrong URL. Always cross-reference
  `tools.ts` against `app.ts` mounts before forming a hypothesis.
- **Don't assume the deployed image matches the source tree.** The
  image is rebuilt on merge to `master` (or `main`, depending on
  repo). If you've been working on a `develop` branch with new
  modules, the running container has none of them. The source tells
  you what the backend CAN do; the container image tells you what it
  ACTUALLY does.
- **Don't `prisma db push` blindly.** If the container's `dev.db` is
  missing tables because the image wasn't rebuilt, the right fix is
  to rebuild and redeploy. `db push` works for a quick smoke but
  leaves the schema-management story inconsistent — migrations are
  not committed.
- **Don't keep escalating "fix the MCP" without checking the deploy
  branch.** If `master` is behind `develop` by several feature
  branches, MCP drift is a SYMPTOM of the deploy cadence, not a bug
  in the MCP code itself. Fix the deploy cadence first; the MCP
  problem resolves when the next image ships.
- **The MCP `description` field in `get_prompt` may not match what
  the backend actually does.** Same root cause as the route drift:
  the MCP is a snapshot of the backend as it was at deploy time.
  Verify against live curl before claiming "the backend does X".
- **Watch for P2021 vs P2025 vs P2002 codes.** They're different bugs
  with different fixes:
  - `P2021` (table missing) → schema drift, run migration
  - `P2025` (row missing) → data inconsistency, fix the use case
  - `P2002` (unique constraint) → bug in the use case, deduplicate
  - `P2003` (foreign key) → cascade bug, fix the parent delete
