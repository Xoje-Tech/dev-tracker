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
