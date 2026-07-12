# dev-tracker-cli (`dt`)

A small command-line interface that wraps the dev-tracker REST API.
Lets you (and agents) drive projects, boards, tasks and tags from the
terminal — no browser, no clicks.

## Install

The CLI is part of the dev-tracker monorepo. From the project root:

```bash
pnpm install
pnpm --filter dev-tracker-cli build
```

To make `dt` available on your PATH without the `pnpm --filter` prefix:

```bash
# from project root
pnpm --filter dev-tracker-cli exec -- npm link
# or copy the binary
ln -s "$(pwd)/cli/dist/index.js" ~/.local/bin/dt
```

## Usage

```bash
dt --help
dt auth --help
```

Common workflow:

```bash
# one-time setup
dt auth login --email me@example.com --password hunter2
# → stores an API key at ~/.dev-tracker/session.json

# list / create / move
dt projects list
dt projects create --name "Marketing Q3" --description "Pipeline"
dt board get <project-id>      # shows columns + tasks
dt tasks create --column <c> --title "Definir ICP" --priority high
dt tasks move <task-id> --to-column <c2> --to-index 0
dt tags create --name urgent --color "#ef4444"
dt tags assign <task-id> <tag-id>
```

## GitHub sync (`dt sync`, `dt issue`, `dt pr`)

Mirror a subset of GitHub state (open issues, open PRs, branches, last 20
Actions runs) into a local gitignored cache at `<repo>/.dev-tracker/sync/`,
then drive single-entity push operations back to GitHub. All GitHub I/O is
mediated through the `gh` CLI — auth, pagination and rate-limits stay with
the existing `gh-app-token-renew` pipeline.

```bash
# Mirror everything in parallel (issues, PRs, branches, runs).
dt sync pull

# Refresh only one entity type (the others' mirror mtime is untouched).
dt sync issues
dt sync prs
dt sync branches
dt sync runs

# Age per entity type; exit 1 if any > 24h stale.
dt sync status
```

Push operations follow the same shape: post the change, sleep 2s to
absorb GitHub's eventual consistency, re-pull and overwrite the affected
mirror file.

```bash
# Issues
dt issue comment 10 --body "Looks good"
dt issue close 10
dt issue reopen 10

# PRs
dt pr comment 55 --body "LGTM"
dt pr review 55 --approve --body "LGTM"
dt pr review 55 --request-changes --body "Please fix X"
dt pr review 55 --comment --body "Question about line 12"
```

All commands respect the root `--json` flag for machine-readable output:

```bash
dt --json sync pull
dt --json issue comment 10 --body "hi"
```

### Requirements

- `gh` CLI installed and authenticated. If either check fails, `dt sync`
  exits non-zero with a remediation hint that points to
  `~/.hermes/skills/github/gh-app-token-renew/assets/renew-gh-token.sh`
  for token renewal.

## Authentication

The CLI prefers **API keys** (sent as `X-API-Key`) over session cookies.
API keys are stateless and never expire on their own; the cookie path
is only used as a fallback while the initial handshake is happening.

- `dt auth login` / `dt auth register` — automatically call
  `/api/auth/rotate-api-key` if the server response didn't include one.
  You end the handshake with a key in `~/.dev-tracker/session.json`.
- `dt auth rotate-key` — explicit rotation; old key is invalidated
  server-side, new one replaces the local copy.
- `dt auth me` — shows current user and the auth mode in use.
- `dt auth where` — shows the session file path, base URL, and mode.
- `dt auth logout` — clears the local session file (does not invalidate
  the server-side session; rotate the key if you need that).

The session file is written with mode `0600` so only the current user
can read it.

## Global flags

- `-u, --url <url>` — API base URL. Defaults to
  `process.env.DEV_TRACKER_URL` or `http://localhost:3000`.
- `--json` — machine-readable JSON output. Default is pretty human
  output. Use `--json` in scripts and pipes.

## Output

- Default: human-friendly tables or text per command.
- `--json`: a single JSON document on stdout. Errors are still printed
  to stderr and exit with a non-zero status.

## Project structure

```
cli/
├── package.json          # workspace package, bin "dt"
├── tsconfig.json
└── src/
    ├── index.ts          # commander entry, registers subcommands
    ├── client.ts         # fetch wrapper, builds auth headers
    ├── session.ts        # read/write ~/.dev-tracker/session.json
    ├── output.ts         # table() + jsonOut() helpers
    └── commands/
        ├── auth.ts       # login, register, me, logout, rotate-key, where
        ├── projects.ts   # list, get, create, archive
        ├── board.ts      # get, init
        ├── tasks.ts      # create, update, move, delete
        └── tags.ts       # list, create, assign, unassign
```
