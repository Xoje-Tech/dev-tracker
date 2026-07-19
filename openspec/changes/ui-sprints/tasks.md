# Tasks: ui-sprints (applied)

Single PR, `size:exception` (~500 LOC). Strict TDD: RED, GREEN, REFACTOR. `SprintForm` needs `useMilestonesStore` data (cross-store read). `SPRINTS_ROUTES` extracted to `src/modules/sprints/domain/routes.ts`.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phases + work units

- [x] 1.1 Add `@client/sprints/*` to `tsconfig.node.json`; add `@client/sprints` to `vite.config.ts` + `vitest.client.config.ts`; add `@sprints` (backend) to `vite.config.ts` + `vitest.client.config.ts`. Create `src/modules/sprints/domain/routes.ts` exporting `SPRINTS_ROUTES`. Refactor `sprint-routes.ts` to import from it.
- [x] 1.2 `BoardTabs.vue` already accepts `tabs[]` — no change needed. `boardTabs` computed in `BoardView` extended in Phase 5.2.
- [x] 2.1 Write `useSprintsStore` (composition API, 5 verbs: fetchAll, fetchOne, create, update, remove). Optimistic mutations with rollback on 4xx/5xx. `milestoneId: null` literal on detach.
- [x] 2.2 Write `sprints.test.ts` — 11 tests covering all 5 verbs + optimistic rollback + `milestoneId: null` detach semantics.
- [x] 3.1 `SprintCard.vue` (name + description + milestone label + Edit button emits `select`).
- [x] 3.2 `SprintForm.vue` (BaseModal + Zod + dialog.kind discriminator + milestoneId select populated by `useMilestonesStore`).
- [x] 4.1 `SprintsList.vue` organism (list + EmptyState + spinner + error).
- [x] 4.2 `SprintsView.vue` page (PageHeader w/ #tabs + dialog state + deep-link handler).
- [x] 5.1 Register routes `/projects/:id/sprints` and `/projects/:id/sprints/:sprintId` in `src/client/router/index.ts` with `meta.requiresAuth`. Lazy-loaded.
- [x] 5.2 Extend `boardTabs` computed in `BoardView.vue` to add the `Sprints` tab. Run full backend + client suites + `pnpm typecheck` (tsc + vue-tsc) + `pnpm build`.

## Total

- 5 phases, 12 work units, ~580 LOC actual. Reference = `MILESTONES_ROUTES` (truly-relative).
- tasks.md on disk: created post-implementation (this file).
- Out of scope: sprint-on-task wiring (5 backend files), drag-drop, board filter, `ProjectCard` sprint count chip, no `package.json`/schema/`src/mcp/client.ts`/`src/app.ts` auth change.

## Implementation summary (added by orchestrator after inline apply)

- Phase 1: 3 config files + new `src/modules/sprints/domain/routes.ts` + refactor of `sprint-routes.ts` to import. 5/39 sprint tests pass before refactor; 39/39 after.
- Phase 2: `useSprintsStore` with 5 methods. 11/11 store tests pass.
- Phase 3: `SprintCard` (45 LOC) + `SprintForm` (~200 LOC) with `milestoneId` select consuming `useMilestonesStore`.
- Phase 4: `SprintsList` (38 LOC) + `SprintsView` (140 LOC) with PageHeader w/ #tabs (3 tabs), dialog state, deep-link handler.
- Phase 5: 2 routes registered; `BoardView.vue` `boardTabs` extended; all gates green.

## Files changed

- `src/modules/sprints/domain/routes.ts` (new, 13 LOC)
- `src/modules/sprints/interface/routes/sprint-routes.ts` (refactor to import)
- `src/client/modules/sprints/domain/types.ts` (new, 30 LOC)
- `src/client/modules/sprints/infrastructure/store/sprints.ts` (new, ~190 LOC)
- `src/client/modules/sprints/infrastructure/store/sprints.test.ts` (new, ~200 LOC, 11 tests)
- `src/client/modules/sprints/interface/components/molecules/SprintCard.vue` (new, 45 LOC)
- `src/client/modules/sprints/interface/components/molecules/SprintForm.vue` (new, ~200 LOC)
- `src/client/modules/sprints/interface/components/organisms/SprintsList.vue` (new, 38 LOC)
- `src/client/modules/sprints/interface/components/pages/SprintsView.vue` (new, 140 LOC)
- `src/client/router/index.ts` (modified, +18 LOC)
- `src/client/modules/board/interface/components/pages/BoardView.vue` (modified, +3 LOC for Sprint tab)
- `tsconfig.node.json` (+1)
- `vite.config.ts` (+2)
- `vitest.client.config.ts` (+2)
- `openspec/changes/ui-sprints/{proposal,design,tasks,verify-report}.md` (new)
- `openspec/changes/ui-sprints/specs/sprint-management/README.md` (new; Engram has full spec)

## Deviations from design

None.

## Issues Found

None blocking. The on-disk spec dir contains only a README; full spec content lives in Engram #581 (same pattern as ui-milestones).

## Status

12/12 tasks complete. Ready for verify.