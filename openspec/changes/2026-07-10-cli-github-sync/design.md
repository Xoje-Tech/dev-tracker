# Design: CLI GitHub Sync

## Technical Approach

Extend `dt` (Node 20+, TS 5, `commander ^14`, CommonJS-compiled, ESM-style `.js` imports) with three Commander command groups — `sync`, `issue`, `pr` — plus a shared `cli/src/gh.ts` wrapper around `child_process.spawn`. All GitHub I/O is mediated through `gh` CLI invocations so auth/pagination/ETags/rate-limit stay owned by the user's `gh-app-token-renew` pipeline. Mirror lives at `<repoRoot>/.dev-tracker/sync/{issues,prs,branches,runs}/`, gitignored, written atomically (tmp → rename). After every push op the CLI sleeps 2s then re-pulls via `gh ... --json` to absorb GitHub's eventual consistency. All new commands respect the root `--json` flag, read via the existing `useJson(program)` pattern already used in `auth.ts`/`projects.ts`/`board.ts`.

## Architecture Decisions

### Decision: gh CLI vs direct GitHub REST

**Choice**: Spawn `gh` via `child_process.spawn` for all GitHub I/O.
**Alternatives**: `fetch` to `api.github.com` with a PAT.
**Rationale**: `gh` owns auth, pagination, ETags, rate-limit headers, and the renew pipeline. Duplicating with raw `fetch` creates a parallel credential surface. Error mapping (401/404/403) becomes a thin layer over `gh` stderr.

### Decision: gh.ts shape — pure functions vs class

**Choice**: Module-level pure functions (`runGh`, `ensureGh`, `parseGhError`).
**Alternatives**: `class GhClient { constructor(); run(); }`.
**Rationale**: CLI is short-lived; no state. Pure functions are easier to mock (`vi.mock('../gh.js')`) and compose, and match `session.ts`. `client.ts` is the exception (carries base URL); `gh.ts` doesn't need that.

### Decision: Validation library — zod vs hand-rolled

**Choice**: Hand-rolled type-guard parsers, NOT zod.
**Alternatives**: Add `zod` to `cli/package.json`.
**Rationale**: `cli/package.json` has NO `zod` dep today; adding it contradicts the proposal's "No new package.json deps" statement. Hand-rolled guards are 10 lines each and adequate for shapes we control. Prompt-vs-reality correction.

### Decision: Cache directory location

**Choice**: `<repoRoot>/.dev-tracker/sync/{issues,prs,branches,runs}/` from `process.cwd()`.
**Alternatives**: `~/.cache/...`, `$XDG_CACHE_HOME`, `node_modules/.cache/`.
**Rationale**: Repo-anchored matches dt's project-scoped purpose and gitignore semantics; per-user dirs lose per-repo separation.

### Decision: Re-pull strategy after push

**Choice**: Sleep 2000ms, re-run the read-shape `gh ... --json ...`, atomically overwrite (`.<n>.json.tmp` → rename).
**Alternatives**: Optimistic update (drifts), webhooks (need server), explicit re-pull (cognitive cost).
**Rationale**: Simplest path that absorbs eventual consistency without a state machine; atomic write prevents half-written files.

### Decision: JSON-mode plumbing

**Choice**: Reuse existing `useJson(program)` pattern; optionally extract to `output.ts`.
**Alternatives**: New `getJsonMode(program)` that walks `program.parent` (proposal's hint).
**Rationale**: Root `program` IS passed to every `register*Commands(program)` call (see `index.ts`), so `program.opts<{ json?: boolean }>().json` already works at subcommand level. Walking `program.parent` would be wrong — subcommands already have root access.

### Decision: Comment truncation policy

**Choice**: Take last 30 comments from API response, sort ascending by `createdAt`.
**Alternatives**: All comments; configurable N; first 30.
**Rationale**: 30 is enough for active-work context without ballooning JSON; ascending matches human reading order.

## Data Flow

```
dt sync pull → ensureGh() → runGh('issue','list','--json',...) → parseIssues()
                                                     │                 │
                                                     ▼                 ▼
                                                GhResult     writeMirror(issues/<n>.json) [atomic]

Push (dt issue 10 close):
  runGh(['issue','close','10']) → sleep(2000)
    → runGh(['issue','view','10','--json',...]) → parseIssue()
    → writeMirror('issues','10', payload) [overwrite]
    → success(json, "closed issue #10")
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cli/src/gh.ts` | Create | `runGh`, `ensureGh`, `parseGhError` — typed `spawn` wrapper |
| `cli/src/cache.ts` | Create | `syncRoot`, `ensureCacheDir`, `writeMirror` (atomic), `readMirror`, `cacheMtime`, `cacheAgeHours` |
| `cli/src/parsers.ts` | Create | `parseIssue`/`Pr`/`Run`/`BranchList` — hand-rolled type guards |
| `cli/src/output.ts` | Modify | Extract `useJson(program)` (replaces 3+ local copies) |
| `cli/src/commands/sync.ts` | Create | `dt sync [pull\|issues\|branches\|prs\|runs\|status]` group |
| `cli/src/commands/issue.ts` | Create | `dt issue <n> {comment,close,reopen}` group |
| `cli/src/commands/pr.ts` | Create | `dt pr <n> {comment,review}` group |
| `cli/src/index.ts` | Modify | Register the three new command groups |
| `.gitignore` | Modify | Add `.dev-tracker/sync/` |
| `cli/README.md` | Modify | Document new commands |
| `cli/src/gh.test.ts` | Create | `runGh` spawn args + exit; `ensureGh` happy/missing/auth-bad; `parseGhError` |
| `cli/src/cache.test.ts` | Create | Atomic write; mtime freshness; `git check-ignore` assertion |
| `cli/src/parsers.test.ts` | Create | Type-guard happy + missing + wrong-type cases |
| `cli/src/commands/sync.test.ts` | Create | All sync subcommands; `--json` mode; `vi.mock('../gh.js')` |
| `cli/src/commands/issue.test.ts` | Create | comment/close/reopen; re-pull happens |
| `cli/src/commands/pr.test.ts` | Create | comment/review for all 3 types; re-pull happens |

## Interfaces / Contracts

```typescript
// cli/src/gh.ts
export interface GhResult { stdout: string; stderr: string; exitCode: number; }
export interface SpawnOpts { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number /* default 30_000 */; }
export function runGh(args: string[], opts?: SpawnOpts): Promise<GhResult>;
export async function ensureGh(): Promise<void>;
export function parseGhError(stderr: string): { kind: 'not_installed' | 'not_authenticated' | 'rate_limited' | 'not_found' | 'unknown'; hint: string };

// cli/src/cache.ts
export type EntityType = 'issues' | 'prs' | 'branches' | 'runs';
export function syncRoot(): string;
export function ensureCacheDir(t: EntityType): Promise<void>;
export function writeMirror(t: EntityType, key: string, payload: unknown): Promise<void>;
export function readMirror<T = unknown>(t: EntityType, key: string): Promise<T | null>;
export function cacheMtime(t: EntityType): Promise<Date | null>;
export function cacheAgeHours(t: EntityType): Promise<number | null>;

// cli/src/parsers.ts — hand-rolled guards (see Decision above)
// IssuePayload: number, title, body|null, state 'OPEN'|'CLOSED', labels[],
//   author{login}, assignees[], comments[] ({author{login}, body, createdAt}),
//   createdAt, updatedAt, closedAt|null, url
// PrPayload extends IssuePayload + headRefName, baseRefName,
//   mergeable 'MERGEABLE'|'CONFLICTING'|'UNKNOWN',
//   reviewDecision 'APPROVED'|'CHANGES_REQUESTED'|'REVIEW_REQUIRED'|null,
//   statusCheckRollup (unknown[]|null), reviews[] ({author{login}, state, body, submittedAt})
// RunPayload: databaseId, name, status, conclusion, headBranch, event, url, createdAt
export function parseIssue(raw: unknown): IssuePayload;
export function parsePr(raw: unknown): PrPayload;
export function parseRun(raw: unknown): RunPayload;
export function parseBranchList(raw: unknown): Array<{ name: string; lastCommitSha: string; lastCommitSubject: string }>;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit `gh.ts` | `runGh` returns `{stdout,stderr,exitCode}`; non-zero exit; `parseGhError` regex | `vi.mock('node:child_process')` |
| Unit `cache.ts` | Atomic tmp→rename; mtime advances; `git check-ignore` exits 0 | Real fs in `os.tmpdir()` |
| Unit `parsers.ts` | Happy shapes; missing field; wrong type | Hand-crafted payloads |
| Unit `commands/sync.ts` | `pull`/`issues`/`branches`/`prs`/`runs`/`status`; `--json` mode | `vi.mock('../gh.js')` + `vi.mock('../cache.js')` |
| Unit `commands/issue.ts` | `comment`/`close`/`reopen`; re-pull happens; cache overwritten | Mock `runGh`; assert call sequence |
| Unit `commands/pr.ts` | `comment`/`review` for all 3 review types; re-pull happens | Mock `runGh` |
| Integration (manual smoke) | Run `dt sync pull` against `Xoje-Tech/dev-tracker`; assert JSON files appear | Documented in `cli/README.md`; not in CI |
| E2E | None — explicitly out of scope per spec | n/a |

## Migration / Rollout

No migration. CLI is additive; no existing command changes. First `dt sync pull` creates `.dev-tracker/sync/`. `.gitignore` updated in the same PR. Rollback = revert PR, delete `.dev-tracker/sync/`, remove the three `register*Commands` calls from `cli/src/index.ts`. No DB migration, no env var changes.

## Open Questions

- `--since <duration>` filter on `dt sync`? → **NO** — spec mandates "all open"; filters are scope creep.
- `--no-refresh` flag on push ops? → **NO** — keep simple; serial users can `dt sync pull` at the end.
- Multiple git remotes — which repo does `gh` target? → **rely on `gh`'s default detection** (cwd's git remote); document in README that CLI must run from inside the repo.
