# Tasks: cli-mcp (applied)

Single PR, `size:exception` (~450 LOC). Strict TDD: RED, GREEN, REFACTOR. McpClient.patch/.delete already exist; verify only.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phases + work units

- Phase 1 REST GET-by-id: 2 use cases + 2 controllers + 2 routes (`MILESTONES_ROUTES.item` / `SPRINTS_ROUTES.item`, parent-nested authz precedes repo). Test: `pnpm exec vitest run src/modules/{milestones,sprints}`. Rollback: revert 2 routes + 2 use-cases. ✅ DONE
- Phase 2 MCP transport verify: `src/mcp/client.test.ts` adds RED block for `.patch` body+headers+JSON, `.delete` bodyless, both non-2xx throws. No edits to `src/mcp/client.ts`. Test: `pnpm exec vitest run src/mcp/client.test.ts`. Rollback: drop new describe block. ✅ DONE
- Phase 3 MCP tools: 11 Zod schemas in `src/mcp/tools.ts` (no `@milestones/*` / `@sprints/*` imports), 11 `executeTool` cases, 11 descriptors in `src/mcp/index.ts`. 7 → 18 tools. Test: `pnpm exec vitest run src/mcp/tools.test.ts src/mcp/index.test.ts`. Rollback: drop 11 schemas + 11 descriptors. ✅ DONE
- Phase 4 CLI: `cli/src/commands/{milestones,sprints}.ts` (aliases `ms`/`sp`) mirroring `commands/projects.ts`; `dt milestones` verbs `list|get|create|update|delete|archive`; `dt sprints` verbs `list|get|create|update|delete` + `--milestone-id <id|null>` for detach. Register in `cli/src/index.ts`. Test: `pnpm --filter dev-tracker-cli exec vitest run`. Rollback: delete 4 files; revert `cli/src/index.ts`. ✅ DONE
- Phase 5 Wiring + verify: full backend + CLI + build green; `pnpm exec vitest run` (312 backend + 117 CLI tests); `pnpm exec tsc --noEmit`; `pnpm build`; smoke `dt milestones list --json` + `dt sprints get <id>` + `pnpm mcp`. ✅ DONE

## Total

- 5 phases, 27 checklist items, ~450 LOC. Reference = `PROJECTS_ROUTES` (truly-relative), NOT `BOARD_ROUTES` (prefix bug).
- tasks.md on disk: created post-implementation (this file).
- Out of scope: Vue/UI, `?milestoneId=` filter, tasks/tags/projects/board CLI/MCP, no `package.json`/schema/`src/mcp/client.ts`/`src/app.ts` auth change.

## Implementation summary (added by orchestrator after sub-agent + inline phases)

- Phase 1: 10 RED→GREEN tests passing (`milestone-get.test.ts` + `sprint-get.test.ts`).
- Phase 2: 4 verification tests added to `src/mcp/client.test.ts` (no source edits to `src/mcp/client.ts`).
- Phase 3: 11 Zod schemas + 11 `executeTool` cases + 11 `ListToolsRequestSchema` descriptors in `src/mcp/{tools.ts,index.ts}`. Total 47/47 tests passing in `src/mcp/`.
- Phase 4: `cli/src/commands/{milestones,sprints}.ts` (~120 LOC). Test files had `apiKey: *** literal placeholder from sub-agent — fixed to `apiKey: "test-key"` via inline sed. All 117/117 CLI tests passing.
- Phase 5: 312/312 backend + 117/117 CLI + typecheck + build all green.

## Files changed

- `src/app.ts` (modified — none expected, but route-contracts test was extended)
- `src/mcp/client.test.ts` (modified — verification block)
- `src/mcp/index.test.ts` (modified — new tool dispatch tests)
- `src/mcp/index.ts` (modified — 11 new tool descriptors)
- `src/mcp/tools.test.ts` (modified — new schema validation tests)
- `src/mcp/tools.ts` (modified — 11 new schemas + cases)
- `src/modules/milestones/interface/controllers/milestone-controller.ts` (modified — added `get`)
- `src/modules/milestones/interface/controllers/milestone-get.test.ts` (new)
- `src/modules/milestones/interface/routes/milestone-routes.ts` (modified — `GET /:milestoneId`)
- `src/modules/milestones/application/use-cases/get-milestone.ts` (new)
- `src/modules/milestones/test-utils/test-app.ts` (modified — added `get` to defaultController)
- `src/modules/sprints/...` (analogous: controller, get-sprint use case, route, test-app)
- `tests/integration/route-contracts.test.ts` (modified — added 10 new route rows)
- `cli/src/commands/milestones.ts` (new, ~120 LOC)
- `cli/src/commands/milestones.test.ts` (new — fixed `***` → `"test-key"`)
- `cli/src/commands/sprints.ts` (new, ~110 LOC)
- `cli/src/commands/sprints.test.ts` (new — fixed `***` → `"test-key"`)
- `cli/src/index.ts` (modified — registered both groups)

## Deviations from design

- Sub-agent left `apiKey: *** literal placeholders in CLI test files. Fixed inline via sed to `apiKey: "test-key"`.
- Spec dirs (`specs/{milestones-management,sprints-management,mcp-server}`) were created empty by a previous dispatch — no spec files inside. Spec content lives only in Engram observations #547/548/549. Acceptable for archive (spec sync was deferred for prior change; pattern matches that).

## Issues Found

None blocking.

## Status

27/27 tasks complete. Ready for verify.