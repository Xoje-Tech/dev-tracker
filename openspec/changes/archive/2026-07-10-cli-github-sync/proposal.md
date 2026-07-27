# Proposal: CLI GitHub Sync

## Intent

Add a `dt sync` capability to the `dt` CLI that mirrors a subset of the project's GitHub state (issues, PRs, branches, Actions runs) into local JSON under `.dev-tracker/sync/` (gitignored), plus supports explicit single-entity push operations (issue comment/close/reopen, PR comment/review) via the `gh` CLI. Today the operator must context-switch between `gh`, the dev-tracker web UI, and the terminal; this brings GitHub workflow surface into the same tool that already drives dev-tracker itself.

## Scope

### In Scope
- New `dt sync [pull]` group: full pull of open issues, open PRs, local+remote branches, last 20 Actions runs.
- Filtered sub-commands: `dt sync issues | branches | prs | runs`.
- `dt sync status` — reports `last_pulled_at` per entity type; warns when >24h stale.
- Push: `dt issue <n> {comment,close,reopen}` and `dt pr <n> {comment,review}` — each reads cached entity, mutates via `gh`, sleeps 2s, re-pulls the affected entity.
- New `cli/src/gh.ts` wrapper around `child_process.spawn` for `gh` invocations with typed result parsing + token-error detection.
- Tests: `cli/src/commands/{sync,issue,pr}.test.ts`, `cli/src/gh.test.ts`. Strict TDD (RED-GREEN-REFACTOR).

### Out of Scope
- Bidirectional bulk sync, conflict resolution, body-content edits.
- Cron / systemd / scheduled pulls (on-demand per user preference).
- Touching Express backend, frontend, Prisma schema.
- >20 Actions runs, webhooks, live updates.

## Capabilities

### New Capabilities
- `cli-github-sync`: Pull mirror of GitHub issues, PRs, branches, and Actions runs into `.dev-tracker/sync/` as JSON, plus explicit push operations (issue comment/close/reopen, PR comment/review) backed by the `gh` CLI. All commands respect the root `--json` flag.

### Modified Capabilities
- None

## Approach

Add three Commander command files (`sync.ts`, `issue.ts`, `pr.ts`) registered in `cli/src/index.ts`. All GitHub I/O flows through `gh.ts`, which spawns `gh` with `--json` flags where supported and parses stdout into typed shapes (`IssuePayload`, `PrPayload`, `RunPayload`, `BranchRef`). Auth is delegated entirely to `gh` (which the user manages via the `gh-app-token-renew` skill) — the CLI does NOT hold or renew the token. `.dev-tracker/sync/` is added to `.gitignore`; a pre-commit guard test asserts the path is ignored. Comments are truncated to last 30 per PR/issue to bound JSON size. Re-pull after push sleeps 2s to avoid races with concurrent edits.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cli/src/commands/sync.ts` | New | Pull / status / filtered sync command group |
| `cli/src/commands/issue.ts` | New | Issue comment/close/reopen push commands |
| `cli/src/commands/pr.ts` | New | PR comment/review push commands |
| `cli/src/gh.ts` | New | Typed `child_process.spawn` wrapper around `gh` |
| `cli/src/index.ts` | Modified | Register the three new command groups |
| `.gitignore` | Modified | Add `.dev-tracker/sync/` |
| `cli/README.md` | Modified | Document new commands with examples |
| `cli/src/commands/*.test.ts`, `cli/src/gh.test.ts` | New | Unit tests (TDD) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `gh` token expired mid-session → 401 | Med | Detect via spawn stderr; print explicit renew guidance: `bash ~/.hermes/skills/github/gh-app-token-renew/assets/renew-gh-token.sh` |
| `gh` CLI not installed on target machine | Low | Startup check via `which gh`; fail fast with install instructions |
| `.dev-tracker/sync/` accidentally committed | Med | `.gitignore` entry + pre-commit guard test asserting path is ignored |
| Large PRs (>100 comments) → unwieldy JSON | Low | Cap comments at last 30 per issue/PR (documented in spec) |
| Drift between cache and remote | Med | `dt sync status` shows `last_pulled_at` per type; warn if >24h stale |
| Re-pull after push races with concurrent edits | Low | Sleep 2s before re-pull; no concurrency control |

## Rollback Plan

CLI commands are additive — no existing command changes. To roll back: revert the PR, delete `.dev-tracker/sync/` from disk, remove the three `register*Commands` calls from `cli/src/index.ts`. No DB migration, no env var changes, no infra impact.

## Dependencies

- `gh` CLI on PATH (operator-managed; renew via `gh-app-token-renew` skill).
- Existing `commander ^14`, `vitest`, and `child_process.spawn` (already in toolchain). No new `package.json` deps.

## Success Criteria

- [ ] `dt sync pull` populates `.dev-tracker/sync/{issues,prs,branches,runs}/` with JSON files.
- [ ] `dt sync status` reports cache age per entity type; warns if any >24h.
- [ ] `dt issue <n> comment --body "..."` posts the comment AND refreshes local cache.
- [ ] `dt issue <n> close` transitions state AND refreshes local cache.
- [ ] `dt pr <n> review --approve --body "..."` posts the review AND refreshes local cache.
- [ ] All new commands respect root `--json` flag.
- [ ] `pnpm --filter dev-tracker-cli test` passes (strict TDD).
- [ ] `pnpm --filter dev-tracker-cli typecheck` passes.
- [ ] `.dev-tracker/sync/` is in `.gitignore` AND pre-commit guard test asserts it.
- [ ] `cli/README.md` documents all new commands with examples.