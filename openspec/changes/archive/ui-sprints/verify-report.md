# Verification Report: ui-sprints

**Change**: `ui-sprints`
**Generated**: 2026-07-19
**Source of truth**: `feat/ui-sprints` branch (not yet pushed)
**Verifier**: orchestrator inline (sub-agent token budget exhausted)

## Mode

- **Strict TDD**: ACTIVE
- **Artifact store**: hybrid (Engram + openspec files)
- **Delivery**: single PR with `size:exception` accepted

## Completeness Table

| Artifact | Status | Location |
|---|---|---|
| proposal.md | ✅ | `openspec/changes/ui-sprints/proposal.md` (431 wc -w) |
| design.md | ✅ | `openspec/changes/ui-sprints/design.md` (595 wc -w) |
| spec.md | ⚠️ Engram-only | `Engram #581` (full content in Engram; on-disk spec dir has only README) |
| tasks.md | ✅ | `openspec/changes/ui-sprints/tasks.md` (12/12 marked complete) |
| apply-progress | ✅ | `Engram #582` |
| **Implementation** | ✅ | 12 files changed, 1 new module + 1 backend file (domain/routes.ts) |

> Spec file warning: on-disk `specs/sprint-management/spec.md` does not exist; content lives in Engram #581. Same pattern as ui-milestones (on-disk lost during apply phase, source of truth in Engram).

## Build/Tests/Typecheck Evidence

| Gate | Command | Result |
|---|---|---|
| Backend full suite | `pnpm exec vitest run` | **312/312** ✅ |
| CLI suite | `pnpm --filter dev-tracker-cli exec vitest run` | **117/117** ✅ |
| Client full suite | `pnpm exec vitest run --config vitest.client.config.ts` | **95/95** ✅ (was 84 before, +11 sprints store tests) |
| TypeScript backend | `tsc --noEmit` | ✅ |
| TypeScript + Vue | `vue-tsc --noEmit` | ✅ |
| Build | `pnpm build` | ✅ |
| **Total tests** | 524/524 | ✅ |

## Spec Compliance Matrix (10 requirements)

### MODIFIED (5 — REST contracts respected by frontend)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Create Sprint | ✅ | `src/client/modules/sprints/infrastructure/store/sprints.ts:81-95` `create()` POSTs to `buildUrl(projectId, undefined)` with `{name, description, milestoneId}` body. Same DTO shape as backend `createSprintDtoSchema`. |
| 2 | Read Sprint (incl. GET /:id) | ✅ | Store `fetchAll()` + `fetchOne()` map to `SPRINTS_ROUTES.collection` + `SPRINTS_ROUTES.item` exactly. 11 tests in `sprints.test.ts` cover both. |
| 3 | Update Sprint (incl. milestoneId: null detach) | ✅ | Store `update()` sends `{milestoneId: null}` literal on detach (verified in `sprints.test.ts:138-152` "sends milestoneId: null literal on detach"). Delta computation: only changed fields sent. |
| 4 | Delete Sprint | ✅ | Store `remove()` DELETEs `SPRINTS_ROUTES.item`. `Task.sprintId SetNull` on referencing tasks confirmed at `prisma/migrations/20260717220221_roadmap_and_sprints/migration.sql` (`Task_sprintId_fkey ON DELETE SET NULL`). |
| 5 | Project Hard-Delete FK Cascade | ✅ | `prisma/schema.prisma:117` `sprintId String?` + `prisma/migrations/20260717220221_roadmap_and_sprints/migration.sql` `Sprint_projectId_fkey ON DELETE CASCADE`. Frontend doesn't break this contract (no `projectId` cascade logic in store). |

### ADDED (5 — UI surface)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Sprints Page Routing | ✅ | `src/client/router/index.ts` lines 54-70: routes `sprints` + `sprint-detail` with `meta.requiresAuth: true`, lazy-loaded. Unknown id → `SprintsView` `fetchOne` returns null + sets `error.value` (no redirect). |
| 2 | Sprints Pinia Store (5 methods) | ✅ | `src/client/modules/sprints/infrastructure/store/sprints.ts` — `useSprintsStore` composition API. **5 methods** (fetchAll, fetchOne, create, update, remove); NO `archive` (sprints have no status). Reads return `null`+`error`; writes throw. Optimistic mutations with rollback. 11/11 tests pass. |
| 3 | Sprints List and Card Components | ✅ | `SprintCard.vue` (name, description, milestone label "Xxx…" or "(none)", Edit button emits `select`). `SprintsList.vue` (renders list, EmptyState for empty list, "New sprint" button slot, BaseSpinner for loading, `<p role="alert">` for error). |
| 4 | Inline Sprint Detail Modal | ✅ | `SprintForm.vue` — BaseModal + Zod schema (name 1-120, description max 2000, milestoneId). `dialog.kind` discriminator (`closed`/`create`/`edit`). `milestoneId` select populated by `useMilestonesStore` (cross-store read). Stays open on validation error. Deep-link via `/projects/:id/sprints/:sprintId` opens modal in edit mode after `fetchOne`. |
| 5 | BoardTabs Tab Switcher Integration | ✅ | `src/client/modules/board/interface/components/pages/BoardView.vue` — `boardTabs` computed extended with Sprints tab. `SprintsView.vue` also renders `BoardTabs` with 3 tabs. `projectId` preserved. Active tab via RouterLink `active-class`. |

**Compliance**: 10/10 requirements ✅.

## Correctness Table (Design Decisions)

| # | Decision | Status | Evidence |
|---|---|---|---|
| 1 | `useSprintsStore` mirrors `useMilestonesStore` | ✅ | Same pattern: composition API, `loading`/`error` refs, optimistic with rollback. |
| 2 | `BoardTabs.vue` extended to 3 tabs | ✅ | `boardTabs` computed in `BoardView.vue` (3 entries); `tabs` computed in `SprintsView.vue` (3 entries). |
| 3 | Inline detail modal | ✅ | `dialogKind` discriminator in `SprintsView.vue`; deep-link via `:sprintId` route param. |
| 4 | `PageHeader #tabs` slot (no change) | ✅ | PR #83 already added the slot. No modification this SDD. |
| 5 | Path aliases added | ✅ | `@client/sprints/*` in `tsconfig.node.json`; `@client/sprints` + `@sprints` (backend) in `vite.config.ts` + `vitest.client.config.ts`. |
| 6 | N/A for sprints (no status field) | — | Sprints don't have lifecycle states. |
| 7 | NEW `domain/routes.ts` file | ✅ | `src/modules/sprints/domain/routes.ts` (13 LOC) exports `SPRINTS_ROUTES`. `sprint-routes.ts` refactored to import it. Backend test suite (39/39) verifies the refactor preserved behavior. |
| 8 | `SprintForm` consumes `useMilestonesStore` | ✅ | `SprintForm.vue` calls `useMilestonesStore().fetchAll(projectId)` on open (via watch). `<select>` populated with milestones. No prop drilling from `SprintsView`. |

**Design coherence**: 7/7 active decisions ✅. 0 deviations (the inline deviation about `storeToRefs` instead of props was incorporated as a refinement, not a deviation).

## Issues Found

### CRITICAL

None.

### WARNING

1. **On-disk spec file empty** (same pattern as ui-milestones). Engram #581 has the source of truth.
2. **`SprintForm` triggers `useMilestonesStore.fetchAll` on every open** — if user navigates to SprintsView before milestones are loaded, the form select shows "(none)" briefly until fetchAll completes. Minor UX glitch, not a correctness issue.
3. **No `?milestoneId=` filter on `fetchAll`** (intentional, per PR #78 spec non-goal). Clients filter client-side if needed. Documented in the design.

### SUGGESTION

1. Add a "Sprints count chip" on `ProjectCard.vue` (out of scope for this SDD per proposal).
2. Add a "filter tasks by sprint" dropdown on `BoardView.vue` (out of scope per proposal Q5).
3. Add E2E test for sprints page navigation (in scope for `ui-e2e` SDD, not this one).

## Final Verdict

**PASS WITH WARNINGS**

- All 10 spec requirements compliant (5 MODIFIED REST + 5 ADDED UI).
- All 7 design decisions reflected in code.
- 524/524 tests green (312 backend + 117 CLI + 95 client).
- typecheck + build green.
- Working tree clean.
- 2 WARNINGS: empty on-disk spec file (Engram has source of truth); brief form loading delay on first open.
- The sprint-on-task gap (`Task.sprintId` exists in Prisma but dropped by 5 backend files) is explicitly out of scope and documented in the spec non-goals.

Ready for `commit + push + PR` + `sdd-archive`.