# Dev Tracker — Project Guide for AI Agents

## Overview

Dev Tracker is a Kanban-style project management application with a REST API backend and Vue 3 frontend.

**Stack:**
- **Backend:** Node.js + TypeScript + Express 5 + Prisma 6 + SQLite
- **Frontend:** Vue 3 + Vite + Tailwind CSS + Pinia + vue-draggable-plus
- **Auth:** Dual — session cookies (browser) + API key (programmatic)
- **Testing:** Vitest + Supertest

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
│   ├── client/
│   │   ├── index.html         # Vite entry HTML
│   │   ├── main.ts            # Vue app bootstrap
│   │   ├── App.vue            # Root component
│   │   ├── style.css          # Tailwind directives
│   │   ├── router/
│   │   │   └── index.ts       # Vue Router (login, projects, board)
│   │   ├── stores/
│   │   │   ├── auth.ts        # Pinia auth store
│   │   │   ├── board.ts       # Pinia board store
│   │   │   └── projects.ts    # Pinia projects store
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── ProjectsView.vue
│   │   │   └── BoardView.vue
│   │   ├── components/        # (empty — add here)
│   │   └── composables/
│   │       ├── useApi.ts      # Fetch wrapper
│   │       └── usePolling.ts  # Polling helper
│   └── shared/
│       ├── schemas/           # Zod validation schemas
│       │   └── index.ts
│       └── types/             # TypeScript types derived from schemas
│           └── index.ts
├── tests/
│   ├── setup.ts               # Loads .env, sets NODE_ENV=test
│   └── smoke.test.ts          # Placeholder test
├── .env                       # Development secrets (gitignored)
├── .env.example               # Template
├── .npmrc                     # pnpm build script approvals
├── tsconfig.json              # Backend TS config (excludes src/client)
├── tsconfig.node.json         # Frontend TS config
├── vite.config.ts             # Vite + proxy to Express
├── vitest.config.ts           # Vitest config
├── tailwind.config.js
└── postcss.config.js
```

## Key Conventions

1. **ESM imports with `.js` extensions** — Always use `.js` in import paths even for `.ts` files
2. **Prisma 6.x** — NOT 7.x (7 broke `env()` in datasource)
3. **Express 5** — Latest version, different error handling than v4
4. **Zod 4.x** — Uses `z.coerce`, `z.enum`, etc.
5. **SQLite with WAL mode** — Better concurrency for development
6. **Dual auth** — Session cookie for browser, `X-API-Key` header for API clients

## Commands

```bash
pnpm install          # Install dependencies
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to SQLite DB
pnpm dev              # Backend dev server (tsx watch)
pnpm dev:client       # Frontend dev server (Vite)
pnpm build            # Build backend (tsc) + frontend (vite)
pnpm start            # Run production build
pnpm test             # Run tests
pnpm typecheck        # Type check without emitting
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
