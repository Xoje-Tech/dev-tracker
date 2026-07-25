# CLI Command Reference

Quick lookup for every command the `dt` CLI exposes. The SKILL.md has
the why/when; this file is just the how.

## Global flags

| Flag | Description | Default |
|------|-------------|---------|
| `-u, --url <url>` | API base URL | `http://localhost:3000` (or `$DEV_TRACKER_URL`) |
| `--json` | Output machine-readable JSON instead of human format | `false` |
| `-V, --version` | Print the CLI version and exit | — |
| `-h, --help` | Print command help and exit | — |

## `dt auth`

| Command | Required | Optional | What it does |
|---------|----------|----------|--------------|
| `login` | `--email`, `--password` | — | Log in, auto-rotate an API key, persist to `~/.dev-tracker/session.json` |
| `register` | `--email`, `--password`, `--name` | — | Register a new user, then log in + auto-rotate |
| `me` | — | — | Show current user + auth mode (`apiKey` / `cookie` / `none`) |
| `logout` | — | — | Clear local session file; best-effort server logout |
| `rotate-key` | — | — | Generate a new API key (invalidates the old one) |
| `where` | — | — | Show session file path + base URL + auth mode |

## `dt projects` (alias: `p`)

| Command | Required | Optional | What it does |
|---------|----------|----------|--------------|
| `list` (alias `ls`) | — | — | List all projects the user is a member of |
| `get <id>` | `<id>` | — | Get one project by id |
| `create` | `--name` | `--description` (max 500) | Create a project; returns the new id |
| `archive <id>` | `<id>` | — | Soft-delete (sets `archived: true`); no `unarchive` in the CLI yet |

## `dt board` (alias: `b`)

| Command | Required | Optional | What it does |
|---------|----------|----------|--------------|
| `get <projectId>` | `<projectId>` | — | Get the kanban board (columns + tasks) for a project |
| `init <projectId>` | `<projectId>` | — | Create the default 4-column board if missing |

The default board has 4 columns: **Backlog** → **In Progress** → **Review** → **Done**.

## `dt tasks` (alias: `t`)

| Command | Required | Optional | What it does |
|---------|----------|----------|--------------|
| `create` | `--column <id>`, `--title` | `--description`, `--priority` (low/medium/high, default medium) | Create a task in a column; returns the new id |
| `update <id>` | `<id>` | `--title`, `--description`, `--priority` | Update any of those fields on a task |
| `move <id>` | `<id>`, `--to-column`, `--to-index` | — | Move a task to a different column + 0-based position |
| `delete <id>` | `<id>` | — | Delete a task |

> **Note**: there is no `tasks list` or `tasks get` in the CLI — the
> board endpoint (`dt board get <projectId>`) returns the full task list
> for a project already.

## `dt tags` (alias: `g`)

| Command | Required | Optional | What it does |
|---------|----------|----------|--------------|
| `list` (alias `ls`) | — | — | List all tags |
| `create` | `--name`, `--color` (hex like `#ef4444`) | — | Create a tag |
| `assign <taskId> <tagId>` | `<taskId>`, `<tagId>` | — | Attach a tag to a task |
| `unassign <taskId> <tagId>` | `<taskId>`, `<tagId>` | — | Detach a tag from a task |

> **No `tags update`** — to rename a tag, delete and re-create. Tag
> assignments on tasks reference ids, not names, so renames don't
> break existing assignments on the backend (but the CLI doesn't
> surface this; you'll see a stale name until you re-fetch).

## Common one-liners

```bash
# register a brand new user end-to-end (creates user, logs in, rotates key)
pnpm cli -- auth register --email me@x.com --password 'sup3r-secret' --name "Me X"

# log in as an existing user
pnpm cli -- auth login --email me@x.com --password 'sup3r-secret'

# show what's in the session file
pnpm cli -- auth where

# list every project, extract non-archived ids
pnpm cli --json projects list | jq -r '.[] | select(.archived==false) | .id'

# create a project, init its board, get the Backlog column id
PID=$(pnpm cli --json projects create --name "Demo" | jq -r .id)
pnpm cli -- board init "$PID"
COL=$(pnpm cli --json board get "$PID" | jq -r '.columns[] | select(.title=="Backlog").id')

# add three tasks at once
for t in "Write spec" "Implement API" "Write tests"; do
  pnpm cli --json tasks create --column "$COL" --title "$t" | jq -r .id
done

# rotate a key (e.g., after a suspected leak)
pnpm cli -- auth rotate-key

# logout (local only)
pnpm cli -- auth logout
```

## Output shapes (when using `--json`)

```jsonc
// dt auth me --json
{
  "user": { "id": "uuid", "email": "x@y.com", "name": "X" },
  "authMode": "apiKey",     // or "cookie" or "none"
  "hasApiKey": true
}

// dt projects list --json
[
  { "id": "uuid", "name": "Demo", "description": "...", "archived": false,
    "createdAt": "ISO", "updatedAt": "ISO", "role": "owner" }
]

// dt board get <id> --json
{
  "id": "uuid", "projectId": "uuid",
  "columns": [
    { "id": "uuid", "title": "Backlog", "order": 0,
      "tasks": [ { "id": "uuid", "title": "x", "priority": "medium", "tagIds": [...] } ] }
  ]
}

// dt tasks create --json
{ "id": "uuid", "columnId": "uuid", "title": "x", "priority": "medium",
  "order": 0, "tagIds": [], ... }

// dt tags list --json
[ { "id": "uuid", "name": "urgent", "color": "#ef4444" } ]
```

## Error shapes (stderr, non-zero exit)

```jsonc
// thrown by ApiError when the server returns a non-2xx
{
  "message": "Validation failed",
  "status": 400,
  "body": { "error": "Validation failed", "details": { ... } }
}
```

The CLI prints `Error: <message>` to stderr and exits with code 1.
The full body is in `err.body` if you need to inspect programmatically —
but for a quick check, the message is usually enough.

## When a command isn't there

The CLI covers the common workflows. For anything missing, fall back
to the underlying API with curl:

```bash
API_KEY=$(jq -r .apiKey ~/.dev-tracker/session.json)
curl -s -H "X-API-Key: $API_KEY" http://localhost:3000/api/<...>
```

Or — for the full set of supported endpoints — see
`src/modules/*/interface/routes/*.ts` in the dev-tracker repo.
