# Dev Tracker — Project Guide for AI Agents

## Overview

Dev Tracker is a Kanban-style project management application with a REST API backend and Vue 3 frontend.

**Stack:**
- **Backend:** Node.js + TypeScript + Express 5 + Prisma 6 + SQLite
- **Frontend:** Vue 3 + Vite + Tailwind CSS 4 + Pinia + vue-router 4 + vue-draggable-plus
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
                                                                    ├── atoms/       (BaseButton, BaseInput, BaseBadge, etc.)
                                                                    ├── molecules/   (FormField, ProjectCard, TaskCard, etc.)
                                                                    ├── organisms/   (ProjectsGrid, KanbanBoard, etc.)
                                                                    ├── templates/   (AppLayout, AuthenticatedLayout, etc.)
                                                                    └── pages/       (LoginView, ProjectsView, etc.)
```

**Path aliases** (defined in `tsconfig.json` for backend, `tsconfig.node.json` for frontend, mirrored in `vitest.config.ts` and `vite.config.ts`):
- Backend: `@/*`, `@auth/*`, `@projects/*`, `@boards/*`, `@tasks/*`, `@tags/*`, `@shared/*`, `@config/*`
- Frontend: `@client/auth/*`, `@client/projects/*`, `@client/board/*`, `@client/tasks/*`, `@client/tags/*`, `@client/shared/*` (note: no broad `@client/*` — it shadowed specifics via Vite's longest-match alias resolution)

**Composition roots:**
- Backend: `src/server/app.ts` — PrismaClient + repos + use cases + controllers + routes
- Frontend: `src/client/router/index.ts` (routes + auth guard) + `src/client/main.ts` (Pinia mount)

## Project Structure

```
dev-tracker/
├── prisma/
│   └── schema.prisma          # 7 models: User, Project, ProjectMember, Board, Column, Task, Tag, TaskTag
├── src/
│   ├── server/                # Backend bootstrap
│   ├── modules/               # BACKEND — hexagonal + screaming
│   │   ├── auth/              # domain/, application/, infrastructure/, interface/
│   │   ├── projects/
│   │   ├── boards/
│   │   ├── tasks/
│   │   ├── tags/
│   │   └── shared/            # cross-cutting (Result, errors, http middleware)
│   ├── client/                # FRONTEND — hexagonal + atomic inside interface/
│   │   ├── modules/
│   │   │   ├── auth/          # types, store, LoginForm, LoginView, AppLayout wrapper, guard
│   │   │   ├── projects/      # types, store, ProjectCard, NewProjectForm, ProjectsView
│   │   │   ├── board/         # types, store, TaskCard, KanbanColumn, KanbanBoard, BoardView
│   │   │   ├── tags/          # types, store, NewTagForm, TagsList, TagsView
│   │   │   └── shared/        # useApi, BaseXxx atoms, FormField/EmptyState/PageHeader molecules, AppLayout template
│   │   ├── router/index.ts    # Vue Router + auth guard
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── App.vue
│   │   └── style.css          # @import "tailwindcss" + @source
│   └── shared/                # cross-cutting backend types/schemas
├── tests/                     # Backend tests (76 passing in 7 files)
│   ├── setup.ts
│   ├── global-setup.ts
│   └── helpers.ts
├── .env / .env.test / .env.test.example
├── tsconfig.json              # Backend
├── tsconfig.node.json         # Frontend aliases
├── vite.config.ts             # Vite root + aliases
├── vitest.config.ts
└── postcss.config.js          # @tailwindcss/postcss + autoprefixer
```

## Implemented Modules

### Backend — all 6 modules functional

| Module | Endpoints |
|--------|-----------|
| `auth` | register, login, logout, me, rotate-api-key |
| `projects` | full CRUD + archive |
| `board` | get, create-default |
| `tasks` | create, update, delete, **move** (column + index) |
| `tags` | list, create, assign-to-task, unassign-from-task |
| `shared` | Result, AppError, error middleware, validation middleware, auth middleware |

### Frontend — all 5 feature modules + shared implemented

| Module | State |
|--------|-------|
| `shared` | useApi, 9 BaseXxx atoms (Button/Input/Badge/Avatar/IconButton/Spinner/TagPill/Textarea/Select/Modal), FormField/EmptyState/PageHeader molecules, AppLayout template |
| `auth` | Pinia store (login/register/logout/fetchMe), LoginForm, TopBarUser, AuthenticatedLayout wrapper, auth-guard |
| `projects` | Pinia store, ProjectCard, NewProjectForm, ProjectsGrid, NewProjectModal, ProjectsView |
| `board` | Pinia store (incl. task CRUD + move), PriorityBadge, TaskCard (with tag pills), ColumnHeader, TaskForm (with tag selector), **TaskTagsField**, KanbanColumn, **KanbanBoard with drag/drop**, BoardView |
| `tags` | Pinia store, NewTagForm, TagsList, TagsView (CRUD only — see Known Gaps) |
| `tasks` | NOT a separate frontend module — tasks live inside the board (see below) |

## Design Decisions

1. **Tasks live inside the board store**, not as a separate Pinia store. Tasks always render inside a column; keeping them nested avoids cross-store sync after a move. Task CRUD actions (create, update, delete, move) are exposed as methods on `useBoardStore()`.

2. **Atomic design bottom-up only** — atoms never import molecules/organisms; pages only compose organisms/templates. Cross-layer imports (e.g. a molecule importing an organism) are forbidden.

3. **`shared/` never depends on feature modules** — `AppLayout` lives in shared but takes a `topbar` slot so the user UI (which depends on `useAuthStore`) lives in `auth/TopBarUser`. Composition happens in feature layouts (`auth/AuthenticatedLayout`).

4. **No broad `@client/*` alias** — only specific `@client/{auth,projects,board,tasks,tags,shared}/*`. A broad prefix shadows specifics via Vite's longest-match resolution.

5. **Auth guard uses `meta.requiresAuth` / `meta.guestOnly`** — applied as a single `router.beforeEach` that calls `/api/auth/me` on first hit. Login form respects `?redirect=...` for post-login return.

6. **Path convention**: ESM imports use `.js` extensions even for `.ts` files (TypeScript ESM requirement).

7. **Tailwind 4, CSS-first config** — `@import "tailwindcss";` + `@source "./**/*.{vue,ts,html}";`. No `tailwind.config.js`. PostCSS plugin is `@tailwindcss/postcss` (separate from `tailwindcss` package).

## Known Gaps

- **No frontend tests** — Vitest covers the backend (76/76 passing) but no `@vue/test-utils` is set up. Worth adding for the stores and organisms before the UI grows further.

## Key Conventions

1. **ESM imports with `.js` extensions** even for `.ts` files
2. **Prisma 6.x** (NOT 7.x — 7 broke `env()` in datasource)
3. **Express 5** — different error handling than v4
4. **Zod 4.x** — `z.coerce`, `z.enum`, etc.
5. **SQLite with WAL mode**
6. **Dual auth** — session cookie for browser, `X-API-Key` header for programmatic
7. **Tailwind 4 CSS-first** — no JS config
8. **No broad `@client/*` alias**
9. **Atomic design bottom-up**
10. **Pinia store in `infrastructure/store/`** — mirrors backend hexagonal convention

## Commands

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev              # Backend (tsx watch)
pnpm dev:client       # Frontend (Vite)
pnpm build            # tsc (backend) + vite build (frontend)
pnpm start            # Production
pnpm test             # 76 tests, 7 files
pnpm typecheck        # Backend tsc --noEmit
pnpm exec vue-tsc --noEmit   # Frontend tsc
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

## Build Profile (as of 2026-06-29)

After the "A toda la UI" sprint, `pnpm build` produces:
- `dist/client/index.html` — 0.39 kB
- `dist/client/assets/index-*.css` — ~21 kB / gzip ~5 kB
- `dist/client/assets/index-*.js` — ~114 kB / gzip ~44 kB (Pinia + router + useApi + Base atoms)
- Lazy chunks per page:
  - `ProjectsView` — 4.5 kB / gzip 1.9 kB
  - `BoardView` — 53 kB / gzip 19 kB (vue-draggable-plus is heavy)
  - `TagsView` — 5 kB / gzip 2.2 kB
  - `PageHeader` shared chunk — 3 kB / gzip 1.4 kB
  - `FormField` shared chunk — 5 kB / gzip 2.1 kB

Total first-load JS (gzip) for `/projects`: ~46 kB. For `/projects/:id/board`: ~65 kB (the +19 kB is the drag/drop lib).
