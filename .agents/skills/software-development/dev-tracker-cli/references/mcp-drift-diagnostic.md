# MCP Drift Diagnostic — When `mcp_dev_tracker_*` Lies

The dev-tracker MCP server (`dist/src/mcp/index.js`) is a thin wrapper
over the REST API at `localhost:6789/api`. It exposes a fixed set of
tools (currently 5–6) defined in `~/projects/dev-tracker/src/mcp/tools.ts`.
The backend exposes 17+ routes. When these two drift apart — either
because the MCP `tools.ts` URL list is stale or because the deployed
container image is missing modules the source has — the MCP returns
errors that don't reflect the backend's actual state.

This file is the companion to the **`dev-tracker-cli-mcp-drift`**
skill. That skill gives the 5-step diagnostic ladder and the recovery
commands; this file is the case study (2026-07-21) and the recipes.

## The 2026-07-21 incident

User asked for the weekly sprint review on the `SCRUM Personal Overview`
dev-tracker project. The flow was: list projects → get project board →
list sprints → list milestones.

What the MCP returned:

```
mcp_dev_tracker_get_project_board  → Not found (404)
mcp_dev_tracker_list_sprints        → Internal server error (500)
mcp_dev_tracker_list_milestones     → Internal server error (500)
```

What the symptoms looked like: "the SCRUM board/sprints/milestones APIs
are broken; the project must be empty or there's a sprint-board bug".

What the symptoms actually were: three independent bugs stacked, all
visible only via direct backend probing.

## The diagnostic ladder (5 steps, ~5 minutes)

### Step 1 — Find the actual deployed port and route

The MCP doesn't tell you what port it talks to; check
`~/.hermes/config.yaml`:

```bash
grep -A2 dev-tracker: ~/.hermes/config.yaml
# DEV_TRACKER_API_URL: http://localhost:6789/api
```

Probe the backend directly to confirm it's up:

```bash
curl -sI http://localhost:6789/health
# HTTP/1.1 200 OK
```

If the backend isn't reachable, the MCP will surface 500s that look
like app bugs but are actually deploy issues. Fix upstream first.

### Step 2 — Compare MCP URL vs backend route constants

Open the MCP's switch statement:

```bash
grep -n "case \"" ~/projects/dev-tracker/src/mcp/tools.ts | head -20
```

Each case calls a URL like `/projects/${args.projectId}/board`. Now
find what the backend actually mounts:

```bash
grep -nE "app\.use\(" ~/projects/dev-tracker/src/app.ts
# app.use(BOARD_ROUTES.base, createBoardRoutes(...));   ← /api/boards
# app.use(SPRINTS_BASE,     createSprintRoutes(...));   ← /api/projects
```

And the per-module route constants:

```bash
cat ~/projects/dev-tracker/src/modules/boards/domain/routes.ts
# export const BOARD_ROUTES = {
#   base: '/api/boards',
#   get: '/:projectId/board',
# } as const;
```

In the 2026-07-21 case:

| MCP call | URL the MCP hit | Real backend URL | Result |
|---|---|---|---|
| `get_project_board` | `/api/projects/:id/board` | `/api/boards/:projectId/board` | 404 (MCP bug, route wrong) |
| `list_sprints` | `/api/projects/:id/sprints` | `/api/projects/:id/sprints` ✓ | 500 (NOT a URL bug — keep going) |
| `list_milestones` | `/api/projects/:id/milestones` | `/api/projects/:id/milestones` ✓ | 500 (NOT a URL bug) |

When the URL is wrong, the bug is in the MCP and you have to either
fix it or bypass it. When the URL is correct and you still get 500,
read the container logs (Step 4).

### Step 3 — Verify the deployed image matches the source

```bash
podman inspect --format '{{.ImageDigest}}' \
  dev-tracker-server_dev-tracker-server_1

# Compare against the most recent published digest:
gh run list --workflow="Publish to GHCR" --limit=3
gh run view <run-id> --log | grep -i digest
```

If the running image is older than the source tree, new modules exist
in source but not in the running backend. This is the most common cause
of "PR B/C/D merged but the deployed API 500s on it".

### Step 4 — Read the container logs for Prisma error codes

```bash
cd ~/dev-tracker-server
podman compose logs --tail 50 dev-tracker-server
```

In the 2026-07-21 case, the logs showed:

```
[dev-tracker-server] | Unhandled error: PrismaClientKnownRequestError:
[dev-tracker-server] | Invalid `prisma.milestone.findMany()` invocation:
[dev-tracker-server] | The table `main.Milestone` does not exist in the current database.
[dev-tracker-server] | code: 'P2021',
[dev-tracker-server] | meta: { modelName: 'Milestone', table: 'main.Milestone' }
```

The Prisma error code tells you the bug class:

| Code | Meaning | Fix |
|---|---|---|
| `P2021` | Table missing | Schema drift — run migration or rebuild image |
| `P2025` | Row missing (FK target) | Data inconsistency — fix the use case that produced it |
| `P2002` | Unique constraint | Duplicate insert — dedupe in the use case |
| `P2003` | Foreign key constraint | Cascade bug — fix parent delete order |

`P2021` is by far the most common in dev-tracker right now because the
SDD pipeline ships schema changes in stacked PRs (`roadmap-and-sprints`
PR B adds milestones, PR C adds sprints, PR D wires them in). If the
PRs aren't all on `master`, the deployed image has none of the new
tables.

### Step 5 — Bypass MCP/CLI with direct REST

The fastest escape hatch is to use curl with the API key from the local
session file:

```bash
API_KEY=$(jq -r .apiKey ~/.dev-tracker/session.json 2>/dev/null)

# If session.json doesn't exist yet, run:
# cd ~/projects/dev-tracker && pnpm cli:dev -- auth login \
#   --email <email> --password <password>

BASE="http://localhost:6789/api"

# Test the route the MCP is failing on:
curl -s -H "x-api-key: $API_KEY" \
  "$BASE/projects/<project-id>/board" | jq .
```

If the curl call succeeds and the MCP call to the same resource fails,
the MCP layer is the bug — use REST until it's fixed. If curl also
fails with the same code, the backend has the bug — read the logs and
fix the schema/use case.

## Recovery paths

| Symptom | Recovery |
|---|---|
| MCP URL doesn't match backend route | Rebuild MCP from source: `cd ~/projects/dev-tracker && pnpm build && podman compose restart`. Or use REST until next deploy. |
| `dt` not on `$PATH` | Use `pnpm cli:dev` from `~/projects/dev-tracker`. Don't waste a turn installing. |
| Backend 500 with `P2021` | Either rebuild the image (correct fix — needs the schema migration committed in the merged PR) or `podman exec -it <ctr> npx prisma db push` (stop-gap only — leaves migrations uncommitted). |
| Backend 500 with `P2025` | Inspect the use case that produced the bad reference; usually a delete cascade bug. |
| Backend 401 Unauthorized | API key mismatch. Resync via `hermes mcp remove dev-tracker && hermes mcp add dev-tracker --env DEV_TRACKER_API_KEY=$(jq -r .apiKey ~/.dev-tracker/session.json) ...`. See the existing API key sync pitfall in `dev-tracker-cli`. |

## When to give up on the surface and use REST directly

Use direct REST whenever any of these is true:

- The MCP URL is drifted (Step 2 confirmed).
- The CLI is missing or too old (Step 1 shows no `dt` on PATH, or `dt --version` is way behind source).
- The backend has unmerged modules exposing new routes (Step 3 confirmed).
- You're doing read-only state inspection (board, project list, sprint list, milestone list).

REST is faster than launching a subprocess and gives you truth in one
round-trip. The CLI is for scripted batch ops; the MCP is for one-shot
agent calls. When both are wrong, REST is the fallback that always works
as long as the backend is up and the API key is valid.

## Related skill

`dev-tracker-cli-mcp-drift` — the same diagnostic philosophy packaged
as a loadable skill with the iron rule and the troubleshooting flow.
This file is the concrete reference; the skill is what you load.
