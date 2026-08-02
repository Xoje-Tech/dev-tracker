---
name: dev-tracker-cli
description: >-
  Drive the dev-tracker REST API from the terminal using the `dt` CLI. Use
  Use when the user asks to create, list, move, or archive dev-tracker
  projects, boards, tasks, or tags, when they want to script or
  automate work that would otherwise require the dev-tracker UI, or
  when an MCP/CLI call returns an error that doesn't match what the
  backend should be doing (route drift, missing modules in the deployed
  image, or Prisma errors). For the latter, load `dev-tracker-cli-mcp-drift`
  for the 5-step diagnostic ladder.
version: 1.2.0
license: Apache-2.0
metadata:
  hermes:
    tags: [cli, dev-tracker, kanban, api]
    related_skills: [project-doctrine, work-unit-commits, github-pr-workflow]
---

# dev-tracker-cli (`dt`)

A small CLI that wraps the dev-tracker REST API. Lives in the dev-tracker
repo at `cli/`; the binary is `dt` (built with tsc, runs on Node 20+).

## When to apply

Load this skill when the user asks you to interact with the dev-tracker
app via natural language — anything that would otherwise mean clicking
through the kanban UI. Examples that should trigger this skill:

- "create a project called Marketing Q3"
- "list my projects"
- "archive project X"
- "show me the board for project Y"
- "add a task 'definir ICP' to the Backlog column"
- "move task T to the Done column"
- "create a tag called urgent"
- "assign the urgent tag to task T"

If the user is editing the dev-tracker code itself (frontend, backend,
doctrine), that is **not** this skill — that's `project-doctrine`.

## How to invoke

From the dev-tracker project root, use the root scripts:

```bash
pnpm cli -- <args>          # built CLI
pnpm cli:dev -- <args>      # tsx mode, no build needed
```

Both forward args straight to `dt`. Prefer `pnpm cli:dev` when iterating
to skip the build step; prefer `pnpm cli` once the binary is built
(recommended default for scripted use).

Global flags: `-u <url>` (defaults to `http://localhost:3000` or
`$DEV_TRACKER_URL`), `--json` for machine-readable output.

## First-time setup (one per machine)

```bash
pnpm cli -- auth login --email <email> --password <password>
# OR
pnpm cli -- auth register --email <email> --password <password> --name "<name>"
```

**⚠️ Important Execution Context:** If `pnpm cli` fails with `MODULE_NOT_FOUND` (because it hasn't been built yet), immediately fall back to `pnpm cli:dev`. Do not attempt to run `cd cli && node dist/index.js` manually, as it will fail if the build step hasn't been run.

Either command **auto-rotates an API key** via `/api/auth/rotate-api-key`
and stores it in `~/.dev-tracker/session.json` (mode 0600). Subsequent
commands authenticate with `X-API-Key: <key>` — stateless, no expiry
to worry about. The session cookie is only used as a fallback for the
initial handshake.

This auto-rotation is the key behavior that makes the CLI agent-friendly:
after one `login` (or `register`), every subsequent command is
stateless and scriptable — no cookie juggling.

Useful introspection:

```bash
pnpm cli -- auth me         # current user + auth mode
pnpm cli -- auth where      # session file path, base URL, auth mode
pnpm cli -- auth rotate-key  # generate a fresh key, invalidate the old
pnpm cli -- auth logout     # clear local session file
```

Administrative & Deployment operations (F5 2026-07-09):

```bash
pnpm cli -- server update            # Update the local Podman server to GHCR :latest
pnpm cli -- update                   # Self-update: check and download latest dt CLI binary
pnpm cli -- server status            # Compare GHCR :latest digest vs running container digest
pnpm cli -- server status --json     # JSON output (preferred for agents/scripts)
pnpm cli -- version                  # Print the dt CLI version (reads cli/package.json at runtime)
pnpm cli -- doctor                   # Run 10 health checks (CLI/server/auth/db/backups/etc.)
pnpm cli -- update-all --yes         # ONE-COMMAND upgrade: downloads new binary + updates server + atomic swap
```

**End-to-end operator workflow (PR #99, added 2026-07-19)**: `dt update-all` collapses what was a 5-step manual sequence (curl + chmod + mv + backup + dt server update) into one command. It downloads the latest binary to `/tmp`, runs `~/dev-tracker-server/scripts/deploy.sh` to update the container, then atomically swaps the old binary to `.bak` and the new one into place. **The binary swap happens LAST** so a failed server update doesn't leave the user with a new CLI reporting on an old server state. Failure modes are surfaced as structured JSON with `ok`, `reason`, `serverUpdate`, `binarySwap` fields.

**When to recommend `dt update-all` vs the manual sequence:**
- New release just published and you want everything updated → `dt update-all --yes`
- CLI itself is too old to know `update-all` (pre-1.7.0 binary) → use the multi-step manual sequence from the verification checklist
- Only want to update the server (keep old CLI) → `dt server update --yes`
- Only want to update the CLI (keep old server) → `dt update --yes`

**Self-update mechanism (2026-07-19)**: `dt update` compares the CURRENT version (now read at runtime via `getCliVersion()` against `cli/package.json`) against the latest GitHub release tag. Before PR #87 this was hardcoded to `1.2.1` and would always report "already on latest version" once you upgraded past 1.2.1 even when there was a newer release. After PR #87 the version detection works correctly across all CLI versions.

If the API key is ever rejected (e.g. rotated server-side without the
CLI knowing), the next command will return `Unauthorized`. Re-run
`auth login` (or `auth rotate-key` if you still have a valid cookie).

## Auth error handling (F4 2026-06-30)

When the server rejects an API key (e.g., after `dt auth rotate-key` invalidates the old one, or against an old session cookie), the CLI surfaces a clear hint instead of a bare `Error("Unauthorized")`:

- **Text mode** (default): error message appends `(Try: dt auth rotate-key)`:
  ```
  Error: Unauthorized (Try: dt auth rotate-key)
  ```
- **JSON mode** (`--json`): structured fields `hint` and `code` are added to the error envelope:
  ```json
  {"error":"Unauthorized","status":401,"code":"API_KEY_REVOKED","hint":"dt auth rotate-key"}
  ```

The `code` field is the stable identifier for downstream tooling — pattern-match on it, not on the human-readable `error` string (which may change between releases).

Programmatic use of the type guard:

```typescript
import { ApiClient, isAuthError } from "dev-tracker-cli";

try {
  await client.request("/api/projects");
} catch (err) {
  if (isAuthError(err)) {
    console.error(`API key invalid (status ${err.status}). Run: dt auth rotate-key`);
    process.exit(2);
  }
  throw err;
}
```

The `--json` flag also affects the top-level catch: any uncaught `ApiError` becomes a JSON envelope so scripts can parse the output without scraping `console.error`.

## Common workflows

**Find the actual API URL before any `dt` invocation (added 2026-07-15):**

The CLI's documented default URL (`http://localhost:3000`) is **stale** in the current podman production deployment. The actual server listens on `localhost:6789`. Running `dt` with no flags against a podman-deployed server returns `Error: fetch failed` — a generic message with no hint that the port is wrong.

Discovery recipe:

```bash
# 1. Find the running container and its exposed port
podman ps --filter name=dev-tracker
# Look for the port mapping, e.g. "6789/tcp"

# 2. Probe the suspected port directly
curl -sI http://localhost:6789/health   # → 200 OK = right port

# 3. Either:
#    a) Always pass -u to dt:
dt -u http://localhost:6789 tasks list
#    b) Or set the env var in your shell rc:
export DEV_TRACKER_URL=http://localhost:6789
```

Workarounds ranked:
1. `dt -u http://localhost:6789 ...` per call (most explicit, never wrong)
2. `export DEV_TRACKER_URL=http://localhost:6789` in shell rc (less typing once set)
3. `dt` with no flags → **broken** against the podman deployment; only works against a docker-compose dev setup

Reported upstream as `Xoje-Tech/dev-tracker` issue #70. The CLI default will likely be fixed in a future version; until then, always use `-u` or the env var.

**Create a project with a board, columns, and tasks:**

```bash
# create
PID=$(pnpm cli --json projects create --name "Marketing Q3" \
  --description "Pipeline for Q3" | jq -r .id)

# init the default board (4 columns: Backlog / In Progress / Review / Done)
pnpm cli -- board init "$PID"
BOARD=$(pnpm cli --json board get "$PID")
COL_BACKLOG=$(echo "$BOARD" | jq -r '.columns[] | select(.title=="Backlog").id')
COL_DONE=$(echo "$BOARD" | jq -r '.columns[] | select(.title=="Done").id')

# add a task
TID=$(pnpm cli --json tasks create --column "$COL_BACKLOG" \
  --title "Definir ICP" --priority high | jq -r .id)

# move it
pnpm cli -- tasks move "$TID" --to-column "$COL_DONE" --to-index 0
```

**Bulk-create tags from a list:**

```bash
for spec in "urgent #ef4444" "feature #10b981" "bug #f59e0b"; do
  name="${spec% *}"
  color="${spec##* }"
  pnpm cli -- tags create --name "$name" --color "$color"
done
```

**Script-friendly JSON pipeline:**

Every command supports `--json` (set on the root command, applies to
the subcommand). Pipe through `jq`:

```bash
pnpm cli --json projects list | jq '.[] | select(.archived==false) | .id'
```

## Patterns

**Always prefer `--json` when you're going to parse the output.**
Human output may include color, tables, or "no rows" markers that
break naive parsers. `--json` gives a single deterministic JSON
document on stdout.

**Capture IDs in variables, don't paste.** Use `$(pnpm cli --json ...)`
and `jq -r .id` to chain commands. This is the agent equivalent of a
human dragging cards around — fast and reliable.

**Auth is a one-liner.** If `auth me` works, every other command works
(with the right IDs in hand). Re-run `auth login` only when you see
`Unauthorized` or `authMode: cookie` (means the key was never rotated).

**`X-API-Key` is the right header for scripts.** Cookies expire and
need the cookie path. Keys don't. Always check `auth me` reports
`authMode: apiKey` before running a long script.

**Server base URL is `http://localhost:3000` by default.** If the
backend runs elsewhere (e.g. `https://staging.dev-tracker.example.com`),
set `DEV_TRACKER_URL` or pass `-u <url>` per call.

## Using dev-tracker via MCP from a Hermes session (preferred for the agent)

The agent almost never shells out to `dt` from inside a session — it calls the `mcp_dev_tracker_*` tools directly. The MCP wraps the same REST API. The two surfaces differ in small but important ways; this section captures the gotchas observed in real sessions.

### MCP surface vs CLI — what's different

| Aspect | CLI (`dt`) | MCP (`mcp_dev_tracker_*`) |
|---|---|---|
| Auth | `pnpm cli -- auth login` then `X-API-Key` | Inherits from `~/.hermes/config.yaml` `mcp_servers.dev-tracker.env` |
| Output | Text or `--json` | Always JSON in tool result |
| `tasks create --order` | **Required** (CLI bug — backend rejects without it) | Auto-filled by MCP (default `order: 0`) |
| `tasks move` (state update) | Unreliable per CLI source code comment | Works correctly via `mcp_dev_tracker_move_task` |
| Project + board discovery | `board init` then `board get` returns column IDs | `create_project` auto-creates a default board; `get_project_board` returns column IDs |

### Standard MCP workflow to create a task in a new project

```python
# 1. Create the project (auto-creates a default 4-column board)
project = mcp_dev_tracker_create_project(name="the-journey-of-xoje")
project_id = project["id"]

# 2. Discover column IDs (board auto-created in step 1)
board = mcp_dev_tracker_get_project_board(projectId=project_id)
backlog_id = next(c["id"] for c in board["columns"] if c["title"] == "Backlog")

# 3. Create the task in the desired column
task = mcp_dev_tracker_create_task(
    projectId=project_id,
    columnId=backlog_id,
    title="i18n del cuerpo del CV",
    description="<concise prose, see gotcha below>",
    priority="medium",
)
```

### Gotchas (observed in production sessions)

- **`create_task` `description` field rejects rich markdown.** Passing a description with `#`/`##` headings or large multi-section bodies (5+ paragraphs with headers, bullets, sub-bullets, code blocks) returns `Validation failed` with no detail. The fix is to write the description as **concise prose** (1-3 short paragraphs, no headings, no nested bullets). Long-form context belongs in engram, the sprint file, or the issue's external references — not in the task body. Confirmed 2026-07-15: a ~1 KB description with headings failed; the same content rewritten as 4 prose sentences succeeded.

- **`create_task` `priority` is free-text, not an enum.** The CLI uses `--priority high|medium|low`; the MCP accepts any string. Pass `"medium"` to match the UI default, or omit.

- **`create_task` does NOT accept `assigneeId`** via the MCP surface even though the response includes it. If you need to assign, do it via the UI or direct REST. Document this as a known gap, not a bug to fix in the agent.

- **`get_project_board` is the only way to find column IDs.** Columns are project-scoped UUIDs. There is no `list_columns_by_title` helper. Always read the board and filter by `.title` — do not hardcode column IDs across projects.

- **No `archive_project` MCP tool yet.** Use the CLI (`dt projects archive <id>`) or the UI. The project is soft-deleted (`archived: true`) and recoverable.

- **No `update_task` MCP tool yet.** To change a task's status, use `move_task`. To change its content, edit via UI or direct REST. The MCP surface is intentionally minimal — read + create + move, no update.

- **`list_projects` excludes archived by default.** Pass `includeArchived: true` if you need them (verify per-call whether this flag exists in your MCP version — earlier versions had no opt-in).

### When to fall back to CLI from a session

Use the CLI only when the MCP lacks the operation you need: archive, update, tag CRUD. The CLI lives at `~/projects/dev-tracker/cli/` and you must `cd` there before running `pnpm cli -- ...`. Don't `cd` from a Hermes session unless you're explicitly scripting batch operations — single-shot calls belong in the MCP.

### When the MCP itself is the broken layer

The MCP server (`mcp_dev_tracker_*` tools) is a snapshot of the backend's route list at deploy time. When you hit a route the MCP exposes and get `Not found` or `Internal server error` from the backend, the MCP may be calling an old URL (e.g., it calls `/api/projects/:id/board` when the real route is `/api/boards/:projectId/board`) or the deployed image may be missing modules that exist in the source tree. The 5-step diagnostic ladder — MCP error → `tools.ts` URL → `app.ts` mounts → `podman compose logs` (look for `PrismaClientKnownRequestError` P2021/P2025) → direct REST with `x-api-key` — is in **`dev-tracker-cli-mcp-drift`** (companion skill). Load it when the MCP error doesn't match what the backend should be doing. Do NOT spend more than one turn debugging the MCP before falling back to direct REST — every minute on a drifted MCP is a minute not spent on the user's actual question.

## Pitfalls

- **Domain Vocabulary Overlap:** The term "project" overlaps with Hermes's native workspace tools (`project_list`). If the user asks general questions like "What projects do we have?" or mentions boards/tasks, ALWAYS assume they mean dev-tracker database entities and use this CLI. Do NOT default to native desktop workspace tools.
- **Execution Context & Environment Confusion:** The CLI source is local to `~/projects/dev-tracker`. However, the PRODUCTION backend runs inside `~/dev-tracker-server` as a Podman Compose stack. **CRITICAL:** Do NOT assume the local `dev` server is what's used. To hit the production API, export `DEV_TRACKER_URL=http://localhost:6789`. If `pnpm cli` fails with `MODULE_NOT_FOUND`, fall back to `pnpm cli:dev`.
  - **Production Architecture & Operations:**
    - **Caddy Reverse Proxy:** Runs containerized inside the compose stack, mapping host ports `8080` (HTTP) and `8443` (HTTPS) to Caddy's internal `80`/`443`. This bypasses rootless Podman's block on privileged ports.
    - **App Service:** Binds to `127.0.0.1:6789:3000` so that the local CLI and Hermes MCP server can communicate with it securely, while being closed to direct public exposure.
    - **Systemd Management:** Managed by a Systemd user-space service `dev-tracker.service` (`systemctl --user`). Note: you must `export XDG_RUNTIME_DIR=/run/user/$(id -u)` to operate `systemctl --user` commands in non-interactive sessions where DBUS/runtime env vars are missing.
    - **Daily Hot Backups:** Executed daily at `03:00 AM` by the `dev-tracker-backup.timer` triggering `~/dev-tracker-server/scripts/backup.sh` (using the host's `/usr/bin/sqlite3` to perform safe `.backup` on `data/dev.db` without locking database writes).
    - **Deploy / Updates:** Run `~/dev-tracker-server/scripts/deploy.sh` to automatically pull latest images, recreate containers, and verify health (checking for HTTP 200).
- **MCP Server API Key Sync:** The production backend container can reject Hermes MCP queries with `{"error": "Unauthorized"}` (401) if the key in `~/.hermes/config.yaml` doesn't match the active API key in the server database/session file. The correct, rotated API key is stored locally in `~/.dev-tracker/session.json` (as the `.apiKey` property). If there's an auth mismatch, retrieve the active key (`jq -r .apiKey ~/.dev-tracker/session.json`), remove the old MCP (`hermes mcp remove dev-tracker`), and register it again with the correct key and production port:
  ```bash
  printf 'Y\n' | hermes mcp add dev-tracker --command node --args /home/hermes/projects/dev-tracker/dist/src/mcp/index.js --env DEV_TRACKER_API_KEY=<active_key> --env DEV_TRACKER_API_URL=http://localhost:6789/api
  ```
- **MCP URL drift vs backend route constants (2026-07-21):** When MCP returns 404 on a route the backend should expose, the MCP `tools.ts` URL is calling an older route shape. Example: MCP `get_project_board` calls `/api/projects/:id/board` but `app.ts` mounts the board router under `/api/boards` with `:projectId` segment → real URL is `/api/boards/:projectId/board`. Fix: rebuild the MCP against current source, or use direct REST until the image catches up. See `dev-tracker-cli-mcp-drift` for the full ladder.
- **MCP tool surface lags the backend (2026-07-21):** The MCP server exposes 5–6 tools in current versions (`list_projects`, `get_project_board`, `create_project`, `create_task`, `move_task`); the backend exposes 17+ routes. If the operation you need isn't in the MCP, **do not pretend it is** — fall back to CLI or direct REST. Don't waste a turn searching for an MCP tool that doesn't exist yet.
- **Deployed image may lack modules the source has (P2021 in podman logs):** When the SDD pipeline ships new modules (e.g., `roadmap-and-sprints` PRs B/C/D) and `master` has them but the production container image hasn't been rebuilt and rolled out, the backend returns `PrismaClientKnownRequestError: The table 'main.Milestone' does not exist in the current database. (code: 'P2021')`. The fix is either (a) rebuild + redeploy the image, or (b) run `prisma db push` against the container's `dev.db` as a stop-gap (leaves schema-management inconsistent — migrations aren't committed). Do NOT keep adding PRs that depend on the new tables — check `podman compose logs dev-tracker-server | grep P2021` before assuming any sprint/milestone route works on the deployed image.
- **Don't paste IDs by hand.** The CLI prints full UUIDs in non-`--json` output (truncated to 8 chars in tables). When you need the real id, re-run with `--json` and extract.
- **`auth logout` is local-only.** It clears the session file; the server-side session cookie is invalidated as a courtesy, but the API key still works until you `auth rotate-key`. Use `rotate-key` for a true credential reset.
- **`projects archive` is soft delete.** The project stays in the DB with `archived: true`. There's no `unarchive` command in this CLI yet — use the UI or hit `PATCH /api/projects/:id` directly.
- **Task move uses 0-based indices.** `--to-index 0` puts the task at the top of the target column. `--to-index 1` puts it second.
- **Tags can't be edited via this CLI** (no `tags update` yet). Delete and re-create, or hit `DELETE /api/tags/:id` directly. Tag assignments on tasks survive a tag edit only if you re-add the same id; renaming a tag is not supported via this CLI.
- **Missing Commands:** The CLI does not yet implement `projects update`.
- **Incomplete Commands:**
  - `tasks create` requires the `--order` parameter. Always include it (e.g., `--order 0` to place it at the top of the column). Otherwise, the backend will reject it with HTTP 400.
  - `tasks move` does not reliably update the task state.
- **Workaround:** If you need to perform these actions, fall back to direct `curl` commands against the REST API (e.g., `curl -X POST -H "X-API-Key: ..." http://localhost:3000/api/tasks -d '{"title": "...", "order": 1, ...}'`).
- **Unified API-Level Offline Fallback**: Avoid duplicating SQLite database states or parsing mechanisms on browser `localStorage` or CLI memory files. Routing unauthenticated requests to a fallback SQLite default user (`offline-user-id`) keeps all clients (CLI, Web, MCP) beautifully synchronized out-of-the-box.
- **SemVer Prefix-Matching Traps**: Simple string truncation (like `.replace(/^.*?v/, '')`) breaks on tools with letter-matching names (e.g., `"dev-tracker"` matched the `"v"` in `"dev"` instead of the version tag). Always parse version tags using explicit regex numeric groups: `/v?(\d+\.\d+\.\d+)/`.
- **Self-Update Workspace Protections**: When programming binary self-update commands (like `dt update`), check environment flags (`process.env.npm_lifecycle_event`, `VITEST`, or `TSX_VERSION`) to bypass file-overwrites and protect the workspace from development pollution.

- **`dt server status` and `dt doctor` `server-up-to-date` check return a GHCR 403 false-positive (KNOWN BUG as of v1.7.0)**: Both commands report `{"error":"Could not fetch latest image digest from GHCR (offline or rate-limited).","code":1,"status":"unknown"}` (or `ghcr-token-403` in `dt doctor`) even when the network and image are perfectly healthy. Root cause verified 2026-07-20: the GHCR `https://ghcr.io/token` endpoint now returns HTTP 403 with `{"code":"DENIED","message":"requested access to the resource is denied"}` for anonymous GET requests. The dt code in `cli/src/commands/system.ts::fetchLatestServerDigest()` does an anonymous GET to `/token` to obtain an OCI bearer token before calling `/manifests/latest`. GHCR has tightened auth on the token endpoint even for public packages, breaking the anonymous flow. **What to do instead of relying on these checks**:
  1. `dt doctor` checks 1-3 (cli-version, cli-up-to-date, server-running), 5-10 (api-reachable, auth, deploy-script, github-cli, database, backups) are reliable — trust them.
  2. For "is the running container actually the latest?", use `podman inspect --format '{{.ImageDigest}}' dev-tracker-server_dev-tracker-server_1` and compare the SHA against the Actions run that published the image (look in `gh run list --workflow="Publish to GHCR" --limit=5`).
  3. For "what's the latest published image digest?", the `softprops/action-gh-release@v2` workflow prints the digest during build — inspect via `gh run view <run-id> --log`.
  4. **Don't waste time "fixing" the user's install** for this false-positive. It's a known bug. The deploy still works (the actual `dt server update --yes` flow uses `podman compose pull` which authenticates via the host's existing podman credentials, NOT the anonymous token dance).
- **Locally installed `dt` may be very stale (2026-07-19)**: The binary at `~/.dev-tracker/bin/dt` was version `0.1.0` even though `cli/package.json` declared `1.2.1` — the previous self-update never fired (because the asset URL pattern changed when release-please took over). The `dt --version` reported `0.1.0`, so `dt version` (PR #87) would not exist either. Before debugging missing CLI features, **verify the installed version with `dt --version` first**, not the package.json version. If the binary is stale, download the latest asset from `https://github.com/Xoje-Tech/dev-tracker/releases/download/<tag>-rerun/dt-linux-x64` (the `-rerun` suffix is where the binaries live, NOT the main release tag which has no assets). The latest binary reports its version through the new `dt version` command (PR #87), which reads `cli/package.json` at runtime via `getCliVersion()`.
## Auth and Session Persistence Pitfalls

- **Express Session behind Proxy / HTTP Production:** When the backend runs in a production-like environment (`NODE_ENV=production`) but is accessed via HTTP (e.g. internal Docker network or behind a reverse proxy that terminates TLS), `express-session` will drop cookies if configured with a hardcoded `secure: true`. 
  - **Fix:** Ensure the Express app calls `app.set("trust proxy", 1);` and the session cookie uses `secure: env.NODE_ENV === 'production' ? 'auto' : false`. This guarantees cookies are set over HTTP in prod-like local environments while respecting HTTPS when proxied.
- **Native Fetch `Set-Cookie` extraction:** The CLI uses native `fetch`. Node 18+ provides `response.headers.getSetCookie()` to extract multiple `Set-Cookie` headers properly, but relying *only* on it can fail depending on the exact Node version or polyfill.
  - **Fix / Fallback Pattern:** Always use a fallback mechanism when extracting session cookies from a native `fetch` response:
    ```typescript
    let setCookies = (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.();
    if (!setCookies || setCookies.length === 0) {
      const raw = response.headers.get("set-cookie");
      if (raw) {
        setCookies = [raw]; // connect.sid is usually the only one we care about in this CLI context
      }
    }
    ```
- **Supertest Cookie Assertions:** When writing tests with `supertest`, the `res.headers["set-cookie"]` property might be a `string` (if only one cookie) or an `Array<string>`. Calling `.find()` directly on it will break the test suite if only one cookie is returned.
  - **Fix:** Normalize before asserting: `(Array.isArray(cookies) ? cookies : [cookies]).find(...)`.

## Backend reference (when you need to escape the CLI)

The CLI covers the common workflows. For anything it doesn't (board
column CRUD, custom column reorder, full task listing, etc.), the
underlying REST API is reachable at the same base URL. From any
agent session, `curl -H "X-API-Key: $(jq -r .apiKey ~/.dev-tracker/session.json)" \
  http://localhost:3000/api/<...>` works as a fallback. The full
backend DTOs are in `src/modules/*/application/dto/*.ts`.

## References

- [CLI command reference](./references/cli-command-reference.md) — every command, every flag, output JSON shapes, common one-liners. Use as a quick lookup table when you know what you want but forgot the exact flag name.
- [Default port drift (3000 vs 6789)](./references/cli-default-port-drift.md) — the port-mismatch story and discovery recipe. Read this first when `dt` returns `Error: fetch failed`.
- [MCP drift diagnostic ladder](./references/mcp-drift-diagnostic.md) — when the MCP returns 404/500 on a route that should exist, the 5-step ladder: MCP error → `tools.ts` URL → `app.ts` mounts → podman logs (Prisma codes) → direct REST. Companion to the `dev-tracker-cli-mcp-drift` skill, includes the 2026-07-21 case study (MCP board route 404 + Prisma P2021).
