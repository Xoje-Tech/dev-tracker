# Tasks: CLI GitHub Sync

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–800 (incl. tests) / 300–400 (code only) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation) → PR 2 (pull) → PR 3 (push + docs + smoke) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: output, gh, parsers, cache, .gitignore + useJson refactor | PR 1 | Base: feat/dt-sync-github-mirror. Phases 1.1–1.10. ~250 LOC code + ~200 LOC tests. Additive-only refactor of 5 files. |
| 2 | Pull + filtered + status commands | PR 2 | Base: PR 1 branch (feature-branch-chain) or stacked-to-main. Phase 2. ~120 LOC code + ~100 LOC tests. |
| 3 | Push (issue + pr) + README + smoke | PR 3 | Base: PR 2 branch (chain) or stacked. Phases 3+4+5. ~140 LOC code + ~150 LOC tests + README. |

## Phase 1: Foundation — shared utilities + refactor

- [x] 1.1 RED cli/src/output.test.ts: useJson(program) returns true when root --json flag is set
- [x] 1.2 GREEN cli/src/output.ts: extract `export function useJson(program: Command): boolean { const root = program.parent ?? program; return Boolean(root.opts<{ json?: boolean }>().json); }`
- [x] 1.3 REFACTOR cli/src/commands/{auth,board,projects,tags,tasks}.ts: delete local `useJson` definitions (5 copies); import from ../output.js
- [x] 1.4 RED cli/src/gh.test.ts: runGh returns {stdout, stderr, exitCode} from mocked spawn; non-zero exit surfaced; ensureGh happy path
- [x] 1.5 GREEN cli/src/gh.ts: `runGh(args, opts?)`, `ensureGh()` (which gh + gh auth status), `parseGhError(stderr)` (regex map)
- [x] 1.6 RED cli/src/parsers.test.ts: parseIssue happy + missing field + wrong type
- [x] 1.7 GREEN cli/src/parsers.ts: hand-rolled type guards (no zod) — `parseIssue`, `parsePr`, `parseRun`, `parseBranchList`
- [x] 1.8 RED cli/src/cache.test.ts: atomic write produces final file; tmp removed; mtime advances; `git check-ignore` assertion exits 0
- [x] 1.9 GREEN cli/src/cache.ts: `syncRoot()` (cwd-relative .dev-tracker/sync), `ensureCacheDir`, `writeMirror` (tmp→rename), `readMirror`, `cacheMtime`, `cacheAgeHours`
- [x] 1.10 .gitignore: add `.dev-tracker/sync/` (anchored at repo root)

## Phase 2: Pull commands (sync)

- [ ] 2.1 RED cli/src/commands/sync.test.ts: `dt sync pull` calls `ensureGh()` + runGh(issue list) + runGh(pr list) + runGh(branch list) + runGh(runs list); writes 4 entity types
- [ ] 2.2 GREEN cli/src/commands/sync.ts: registerSyncCommands(program); `dt sync [pull]` action handler
- [ ] 2.3 RED cli/src/commands/sync.test.ts: `dt sync issues|branches|prs|runs` filtered; only one entity refreshes; others' mtime unchanged
- [ ] 2.4 GREEN cli/src/commands/sync.ts: filtered subcommands
- [ ] 2.5 RED cli/src/commands/sync.test.ts: `dt sync status` shows age per entity; stale warning at >24h
- [ ] 2.6 GREEN cli/src/commands/sync.ts: status subcommand
- [ ] 2.7 cli/src/index.ts: register registerSyncCommands(program)

## Phase 3: Push commands (issue)

- [ ] 3.1 RED cli/src/commands/issue.test.ts: `dt issue 10 comment --body "..."` calls runGh(issue comment 10 ...); sleeps 2000ms; re-pulls via runGh(issue view 10 --json ...); overwrites cache
- [ ] 3.2 GREEN cli/src/commands/issue.ts: comment subcommand
- [ ] 3.3 RED cli/src/commands/issue.test.ts: `dt issue 10 close` calls runGh(issue close 10); re-pulls; cache shows CLOSED
- [ ] 3.4 GREEN cli/src/commands/issue.ts: close + reopen subcommands
- [ ] 3.5 cli/src/index.ts: register registerIssueCommands(program)

## Phase 4: Push commands (pr)

- [ ] 4.1 RED cli/src/commands/pr.test.ts: `dt pr 55 comment --body "..."` calls runGh(pr comment 55 ...); re-pulls
- [ ] 4.2 GREEN cli/src/commands/pr.ts: comment subcommand
- [ ] 4.3 RED cli/src/commands/pr.test.ts: `dt pr 55 review --approve --body "..."` calls runGh(pr review 55 --approve); re-pulls
- [ ] 4.4 GREEN cli/src/commands/pr.ts: review subcommand (approve / request-changes / comment)
- [ ] 4.5 cli/src/index.ts: register registerPrCommands(program)

## Phase 5: Documentation + smoke

- [ ] 5.1 cli/README.md: document `dt sync pull|issues|branches|prs|runs|status`, `dt issue <n> {comment,close,reopen}`, `dt pr <n> {comment,review}` with examples + output samples
- [ ] 5.2 cli/README.md: note that `dt sync` requires `gh` CLI authenticated; point to `gh-app-token-renew` skill for token renewal
- [ ] 5.3 Manual smoke: run `pnpm --filter dev-tracker-cli build && node cli/dist/index.js sync pull` against ~/projects/dev-tracker; assert .dev-tracker/sync/{issues,prs,branches,runs}/ populated
- [ ] 5.4 pnpm --filter dev-tracker-cli test passes (all RED→GREEN→REFACTOR completed)
- [ ] 5.5 pnpm --filter dev-tracker-cli typecheck passes
