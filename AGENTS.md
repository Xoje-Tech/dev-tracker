# Dev Tracker — Project Guide for AI Agents

## Overview

Dev Tracker is a Kanban-style project management application with a REST API backend and Vue 3 frontend.

**Stack:**
- **Backend:** Node.js + TypeScript + Express 5 + Prisma 6 + SQLite
- **Frontend:** Vue 3 + Vite + Tailwind CSS 4 + Pinia + vue-router 4
- **Auth:** Dual — session cookies (browser) + API key (programmatic)
- **Testing:** Vitest + Supertest

## Architecture

**Backend AND frontend** follow Hexagonal + Screaming Architecture, with **Atomic Design** as the internal organization of every module's `interface/components/`:

```
backend (Express):
src/modules/{auth,projects,board,tasks,tags,shared}/
    domain/         application/      infrastructure/      interface/

frontend (Vue):
src/client/modules/{auth,projects,board,tasks,tags,shared}/
    domain/         application/      infrastructure/      interface/
                                                               └── components/
                                                                    ├── atoms/       (BaseButton, BaseInput, etc.)
                                                                    ├── molecules/   (AuthField, LoginForm, etc.)
                                                                    ├── organisms/   (AuthCard, KanbanColumn, etc.)
                                                                    ├── templates/   (AuthLayout, AppLayout, etc.)
                                                                    └── pages/       (LoginView, BoardView, etc.)
```

**Path aliases** (defined in `tsconfig.json` for backend, `tsconfig.node.json` for frontend, mirrored in `vitest.config.ts` and `vite.config.ts`):
- Backend: `@/*`, `@auth/*`, `@projects/*`, `@boards/*`, `@tasks/*`, `@tags/*`, `@shared/*`, `@config/*`
- Frontend: `@client/auth/*`, `@client/shared/*` (note: no broad `@client/*` — it shadowed specifics via Vite's longest-match alias resolution)

**Composition roots:**
- Backend: `src/server/app.ts` — PrismaClient + repos + use cases + controllers + routes
- Frontend: `src/client/router/index.ts` (routes) + `src/client/main.ts` (Pinia + router mount)

## Project Structure

```
dev-tracker/
├── prisma/
│   └── schema.prisma          # 7 models: User, Project, ProjectMember, Board, Column, Task, Tag, TaskTag
├── src/
│   ├── server/
│   │   ├── index.ts           # Entry point — bootstrap
│   │   ├── app.ts             # createApp() factory
│   │   ├── prisma.ts          # PrismaClient singleton with WAL mode
│   │   ├── config/
│   │   │   └── env.ts         # Zod env validation
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts # Centralized error handler (ZodError, AppError)
│   │   │   └── auth.ts        # Dual auth: session + API key
│   │   ├── routes/
│   │   │   ├── auth.ts        # /api/auth/*
│   │   │   ├── projects.ts    # /api/projects/*
│   │   │   ├── board.ts       # /api/projects/:id/board, /api/columns/*
│   │   │   ├── tasks.ts       # /api/columns/:id/tasks, /api/tasks/*
│   │   │   └── tags.ts        # /api/tags/*
│   │   ├── services/
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── board.ts
│   │   │   ├── tasks.ts
│   │   │   └── tags.ts
│   │   └── types/
│   │       └── express.d.ts   # Extends Request with user field
│   ├── modules/               # BACKEND — hexagonal + screaming
│   │   ├── auth/              # domain/, application/, infrastructure/, interface/
│   │   ├── projects/          # ...
│   │   ├── boards/            # ...
│   │   ├── tasks/             # ...
│   │   ├── tags/              # ...
│   │   └── shared/            # cross-cutting (Result, errors, http middleware)
│   ├── client/                # FRONTEND — hexagonal + atomic inside interface/
│   │   ├── modules/
│   │   │   ├── auth/          # implemented (see Auth section below)
│   │   │   └── shared/        # useApi composable, BaseInput, BaseButton
│   │   ├── router/
│   │   │   └── index.ts       # Vue Router (currently: /, /login)
│   │   ├── index.html         # Vite entry HTML
│   │   ├── main.ts            # Vue app bootstrap (Pinia + router)
│   │   ├── App.vue            # <RouterView />
│   │   └── style.css          # @import "tailwindcss" + @source
│   └── shared/                # cross-cutting backend types/schemas (separate from modules/shared/)
├── tests/
│   ├── setup.ts               # Loads .env.test, sets NODE_ENV=test
│   ├── global-setup.ts        # Resets test DB, pushes schema — runs ONCE
│   └── helpers.ts             # clearDatabase() for per-test cleanup
├── .env                       # Development secrets (gitignored)
├── .env.test                  # Test secrets (gitignored, see .env.test.example)
├── .env.test.example          # Placeholder values for fresh checkouts
├── .npmrc                     # pnpm build script approvals
├── tsconfig.json              # Backend TS config (excludes src/client)
├── tsconfig.node.json         # Frontend TS config (client aliases)
├── vite.config.ts             # Vite + resolve.alias + proxy to Express
├── vitest.config.ts           # Vitest config + backend aliases
└── postcss.config.js          # @tailwindcss/postcss + autoprefixer (Tailwind 4)
```

## Implemented Modules

### Backend — all 6 modules functional

| Module | Endpoints |
|--------|-----------|
| `auth` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/rotate-api-key` |
| `projects` | full CRUD + archive |
| `board` | board fetch, column CRUD |
| `tasks` | task CRUD, move between columns (algorithm in `references/task-move-reorder-algorithm.md`) |
| `tags` | tag CRUD, assign/unassign |
| `shared` | Result type, AppError, error middleware, validation middleware, auth middleware |

### Frontend — auth pilot complete, others pending

| Module | State |
|--------|-------|
| `shared` | useApi composable, BaseButton, BaseInput atoms |
| `auth` | Pinia store (login/register/logout/fetchMe), full LoginView (atoms → page) |
| `projects` | NOT STARTED |
| `board` | NOT STARTED |
| `tasks` | NOT STARTED |
| `tags` | NOT STARTED |

## Key Conventions

1. **ESM imports with `.js` extensions** — Always use `.js` in import paths even for `.ts` files
2. **Prisma 6.x** — NOT 7.x (7 broke `env()` in datasource)
3. **Express 5** — Latest version, different error handling than v4
4. **Zod 4.x** — Uses `z.coerce`, `z.enum`, etc.
5. **SQLite with WAL mode** — Better concurrency for development
6. **Dual auth** — Session cookie for browser, `X-API-Key` header for API clients
7. **Tailwind 4** — CSS-first config (`@import "tailwindcss"`, `@source`); no `tailwind.config.js`
8. **No broad `@client/*` alias** — Only specific `@client/{auth,shared}/*`; broad prefix shadowed specifics
9. **Atomic design bottom-up** — atoms never import molecules/organisms; pages only compose organisms
10. **Pinia store in `infrastructure/store/`** — Mirrors backend hexagonal layer convention

## Commands

```bash
pnpm install          # Install dependencies
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to SQLite DB
pnpm dev              # Backend dev server (tsx watch)
pnpm dev:client       # Frontend dev server (Vite)
pnpm build            # Build backend (tsc) + frontend (vite build)
pnpm start            # Run production build
pnpm test             # Run tests (76 passing in 7 files)
pnpm typecheck        # Type check backend (tsc --noEmit)
pnpm exec vue-tsc --noEmit   # Type check frontend
```

## Database Schema

7 models with cascade deletes:
- **User** → has many ProjectMember, assigned Tasks, created Tasks
- **Project** → has many ProjectMember, one Board
- **ProjectMember** → join table (unique on [projectId, userId])
- **Board** → belongs to Project (1:1), has many Columns
- **Column** → belongs to Board, has many Tasks
- **Task** → belongs to Column, has many TaskTag
- **Tag** → has many TaskTag
- **TaskTag** → join table (composite PK [taskId, tagId])

## Recent Session State (2026-06-29)

**Auth pilot migration complete** (5 commits):
1. `chore(client): scaffold modules/ skeleton for hexagonal + atomic`
2. `feat(client/shared): add useApi composable and Base atoms`
3. `feat(client/auth): Pinia auth store + client path aliases`
4. `feat(client/auth): LoginView with atomic component layers`
5. `feat(client): wire router + close pending frontend setup`

Login flow now works end-to-end at `/login`. Register flow uses the same store action but no RegisterView organism yet.

**Next natural step:** replicate the auth pattern in `projects/` (list + create + grid) before tackling `board/` (more complex: drag/drop, columns, tasks).
