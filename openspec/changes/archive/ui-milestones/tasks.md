# Tasks — ui-milestones

Single PR with `size:exception` (~740 LOC). Five phases, twelve tasks total.
Strict TDD (RED → GREEN → REFACTOR) per cluster.

## Phase 1 — Aliases, Router Shell, BoardTabs

- [x] 1.1 Add `@client/milestones/*` alias to `tsconfig.node.json`, `vite.config.ts`, `vitest.client.config.ts`; add `@milestones` backend alias to `vite.config.ts` (and mirror all backend `@*` aliases in `vitest.client.config.ts` — pre-existing fix bundled).
- [x] 1.2 Add additive `#tabs` slot to `PageHeader.vue`. Create `BoardTabs.vue` at `src/client/modules/shared/interface/components/molecules/`. TDD: component test for tab rendering with mock `RouterLink`.

## Phase 2 — Pinia Store

- [x] 2.1 RED — write tests for `useMilestonesStore` covering all six verbs (`fetchAll`, `fetchOne`, `create`, `update`, `delete`, `archive`).
- [x] 2.2 GREEN — implement store (composition API mirroring `useBoardStore`). Methods: `fetchAll(projectId, {includeArchived})`, `fetchOne`, `create`, `update`, `delete`, `archive`. Optimistic mutations with rollback on 4xx/5xx.
- [x] 2.3 REFACTOR — extract URL constants, dedupe error handling.

## Phase 3 — Atoms and Molecules

- [x] 3.1 `MilestoneStatusBadge.vue` atom (status → BaseBadge variant: open→info, closed→success, archived→warning).
- [x] 3.2 `MilestoneCard.vue` molecule (title + dueDate + badge; emits `select`).
- [x] 3.3 `MilestoneForm.vue` molecule (BaseModal + Zod validation + dueDate timezone handling).

## Phase 4 — Organisms and Page

- [x] 4.1 `MilestonesList.vue` organism (list + EmptyState + "New" button + BaseSpinner + error display).
- [x] 4.2 `MilestonesView.vue` page (PageHeader w/ #tabs, dialog state, deep-link handler that opens modal in edit mode).

## Phase 5 — Wiring and Verification

- [x] 5.1 Register routes `/projects/:id/milestones` and `/projects/:id/milestones/:milestoneId` in `src/client/router/index.ts` with `meta.requiresAuth`. Lazy-loaded.
- [x] 5.2 Mount `BoardTabs` in `BoardView.vue` (placeholder until sprints SDD adds the Sprint tab). Run full suite + typecheck + build.

## Notes

- **No client-side membership check** — backend MilestoneMembershipGuard enforces 403; UI surfaces via `error.value`.
- **Atomic design bottom-up** — atoms never import molecules.
- **Test pattern**: store integration via `mockFetch` from `tests/client-helpers.ts`.
