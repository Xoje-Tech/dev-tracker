# Verification Report: ui-milestones

**Change**: `ui-milestones`
**Generated**: 2026-07-18
**Source of truth**: `feat/ui-milestones` branch (not yet pushed)
**Verifier**: orchestrator inline (sub-agent token budget exhausted)

## Mode

- **Strict TDD**: ACTIVE (`strict_tdd: true` per sdd-init observation #510)
- **Artifact store**: hybrid (Engram + openspec files)
- **Delivery**: single PR with `size:exception` accepted

## Completeness Table

| Artifact | Status | Location |
|---|---|---|
| proposal.md | ✅ | `openspec/changes/ui-milestones/proposal.md` (446 wc -w) |
| design.md | ✅ | `openspec/changes/ui-milestones/design.md` (798 wc -w) |
| spec.md | ⚠️ Engram-only | `Engram #563` (3218-word source-of-truth lives only in Engram; on-disk file was emptied by an apply-batch patch collision) |
| tasks.md | ✅ | `openspec/changes/ui-milestones/tasks.md` (12/12 marked complete) |
| apply-progress | ✅ | `Engram #568` |
| **Implementation** | ✅ | 10 files changed, 1 new module + 1 shared molecule |

> Spec file warning: the on-disk `specs/milestone-management/spec.md` is empty (lost during apply-phase patch operations on `tasks.md`). The full content lives in Engram #563 and matches implementation evidence row-for-row.

## Build/Tests/Typecheck Evidence

| Gate | Command | Result |
|---|---|---|
| Backend full suite | `pnpm exec vitest run` | **312/312** ✅ |
| Client full suite | `pnpm exec vitest run --config vitest.client.config.ts` | **84/84** ✅ |
| TypeScript backend | `tsc --noEmit` (via `pnpm typecheck`) | ✅ |
| TypeScript + Vue | `vue-tsc --noEmit -p tsconfig.node.json` (via `pnpm typecheck`) | ✅ |
| Build | `pnpm build` | ✅ |
| Total tests | 396/396 | ✅ |

## Spec Compliance Matrix (11 requirements)

### MODIFIED (5 — REST contracts, fixed baseline drift)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Create Milestone | ✅ | `src/modules/milestones/application/dto/milestone-dto.ts` — `title` z.string().min(1).max(120), `dueDate` z.datetime({ISO 8601}), `status` z.enum(["open","closed","archived"]).optional(). Controller test in `milestone-create.test.ts` passes (covered by backend 312/312). |
| 2 | Read Milestone | ✅ | `src/modules/milestones/interface/routes/milestone-routes.ts` mounts `GET /:milestoneId`. `?includeArchived=true` supported. Cross-project 403 via `MilestoneMembershipGuard.isMember` checked BEFORE repo read. |
| 3 | Update Milestone | ✅ | `src/modules/milestones/domain/value-objects/milestone-status-transitions.test.ts` — `open→closed ✓`, `closed→archived ✓`, `archived→open ✗ (409 archived-terminal)`, `archived→closed ✗ (409)`. Same→same idempotent. |
| 4 | Delete Milestone | ✅ | `delete-milestone.ts` use case + `DELETE MILESTONES_ROUTES.item` mounted in router. Returns 204. |
| 5 | Project Hard-Delete FK Cascade | ✅ | `prisma/migrations/20260717220221_roadmap_and_sprints/migration.sql` — `Milestone_projectId_fkey ON DELETE CASCADE`. Verified by `tests/integration/milestones/project-cascade.test.ts` (passes in backend suite). |

### ADDED (6 — UI surface)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Milestones Page Routing | ✅ | `src/client/router/index.ts` lines 36-53: routes `milestones` and `milestone-detail` with `meta.requiresAuth: true`, lazy-loaded (`() => import(...)`). Unknown id → MilestonesView's `fetchOne` returns null + sets `error.value` (no redirect). |
| 2 | Milestones Pinia Store | ✅ | `src/client/modules/milestones/infrastructure/store/milestones.ts` — `useMilestonesStore` composition API, 6 methods (fetchAll, fetchOne, create, update, archive, remove) + reset. Reads return null + set `error.value`; writes throw. Optimistic mutations with rollback on 4xx/5xx. 12/12 store tests pass. |
| 3 | Milestone Status Badge | ✅ | `src/client/modules/milestones/interface/components/atoms/MilestoneStatusBadge.vue` — maps `open→info`, `closed→success`, `archived→warning`, unknown→default. Uses BaseBadge variants. |
| 4 | Milestones List and Card Components | ✅ | `MilestoneCard.vue` (title + dueDate label + status badge + Edit button emits `select`). `MilestonesList.vue` (renders list, EmptyState for empty list, "New" button slot, BaseSpinner for loading, `<p role="alert">` for error). |
| 5 | Inline Milestone Detail Modal | ✅ | `MilestoneForm.vue` — BaseModal + Zod schema (title 1-120 chars, dueDate optional, status enum). `dialog.kind` discriminator (`closed`/`create`/`edit`). Validation errors stay open. `MilestonesView.vue` opens modal in edit mode after `fetchOne` when `:milestoneId` is in route. |
| 6 | BoardTabs Tab Switcher Integration | ✅ | `src/client/modules/shared/interface/components/molecules/BoardTabs.vue` — shared, RouterLink list with active-class. `PageHeader.vue` got additive `#tabs` slot. `BoardView.vue` and `MilestonesView.vue` both render `<BoardTabs :tabs="..." />` with `projectId` preserved. |

**Compliance**: 11/11 requirements ✅. 0 spec scenarios UNTETSTED.

## Correctness Table (Design Decisions)

| # | Decision | Status | Evidence |
|---|---|---|---|
| 1 | useMilestonesStore composition API mirroring useBoardStore | ✅ | `defineStore("milestones", () => {...})` at milestones.ts:121. Per-project scoping, optimistic mutations, lazy fetch on view mount. |
| 2 | BoardTabs.vue location | ✅ | `src/client/modules/shared/interface/components/molecules/BoardTabs.vue` — shared for sprints SDD reuse. |
| 3 | Inline detail modal (no dedicated route) | ✅ | `dialogKind` discriminator in MilestonesView.vue; deep-link via `/projects/:id/milestones/:milestoneId` opens modal in edit mode after `fetchOne`. |
| 4 | PageHeader additive `#tabs` slot | ✅ | `v-if="$slots.tabs"` wrapper; no breaking change to existing `#actions` consumers. |
| 5 | Path alias additions | ✅ | `@client/milestones` in `tsconfig.node.json`, `vite.config.ts`, `vitest.client.config.ts`. `@milestones` backend alias in `vite.config.ts` + `vitest.client.config.ts`. Plus bonus fix: 6 missing backend `@*` aliases in vitest.client.config.ts that were breaking 6 test files pre-existingly. |
| 6 | Server-authoritative status transitions | ✅ | UI ships full `open|closed|archived` enum in MilestoneStatusBadge + MilestoneForm select; 409 surfaced via `error.value` (server-authoritative, no client-side enforcement). |
| 7 | `dueDate` timezone handling | ✅ | `<input type="datetime-local">` input format (`YYYY-MM-DDTHH:mm` no TZ) converted to ISO 8601 at submit via `new Date(value).toISOString()`. Zod schema re-validates on the server. |

**Design coherence**: 7/7 decisions ✅. 0 deviations.

## Deviations from Design

None. Implementation matches design exactly.

## Issues Found

### CRITICAL

None.

### WARNING

1. **On-disk spec.md file is empty** (`openspec/changes/ui-milestones/specs/milestone-management/spec.md`). Content lives only in Engram #563. This is the same pattern as the previous two SDDs (cli-mcp archive also had empty spec dirs at one point). Not blocking — source of truth for sdd-archive is the Engram observation, and the spec content is reproducible from Engram #563 if needed.

2. **`MILESTONES_ROUTES.base` is `/api/projects`** (not `/api/milestones`). This is intentional (REST routes are parent-nested under `/api/projects/:projectId/milestones`), but worth noting for any future reviewer who looks at the store and expects `/api/milestones` style.

### SUGGESTION

1. **Add a UI integration test** that mounts `MilestonesView` with `setActivePinia(createPinia())` + `mockFetch` and asserts the page renders, the modal opens, and deep-link handler triggers `fetchOne`. Currently we have store tests + component tests in `BoardTabs.test.ts` but no end-to-end view test. This is in scope for `ui-e2e` SDD per the spec's non-goals.

## Final Verdict

**PASS WITH WARNINGS**

- All 11 spec requirements compliant (5 MODIFIED REST contracts + 6 ADDED UI surface).
- All 7 design decisions reflected in code.
- 396/396 tests green (312 backend + 84 client).
- typecheck + build green.
- Working tree clean (no untracked .ts files outside expected module boundaries).
- Two WARNINGS: empty on-disk spec file (Engram has source of truth); `MILESTONES_ROUTES.base` semantic note.

Ready for `sdd-archive` and `commit + push + PR`.