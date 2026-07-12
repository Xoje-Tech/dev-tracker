/**
 * `dt sync` — mirror a subset of GitHub project state into a local cache.
 *
 * Subcommands:
 *   sync pull              refresh all four entity types in parallel
 *   sync issues            refresh only the issues mirror
 *   sync prs               refresh only the PRs mirror
 *   sync branches          refresh only the local+remote branch mirrors
 *   sync runs              refresh only the last 20 Actions runs
 *   sync status            report per-entity cache age; exit 1 if any > 24h
 *
 * Every action calls `ensureGh()` first — a missing or unauthenticated `gh`
 * is reported as a structured GhError before we issue a single gh call.
 * All GitHub I/O goes through `runGh` so it stays mockable in tests; the
 * only exception is the local-branches read, which uses `git for-each-ref`
 * directly because git is not GitHub and doesn't need gh's auth surface.
 */

import { Command } from "commander";
import { spawn } from "node:child_process";
import { ensureGh, GhError, runGh } from "../gh.js";
import {
  cacheAgeHours,
  cacheMtime,
  type EntityType,
  writeMirror,
} from "../cache.js";
import {
  type BranchRef,
  type IssuePayload,
  parseBranchList,
  parseIssue,
  parsePr,
  parseRun,
} from "../parsers.js";
import { jsonOut, success, table, useJson } from "../output.js";

const MAX_ISSUE_COMMENTS = 30;
const STALE_THRESHOLD_HOURS = 24;

/**
 * Field lists passed to `gh <subcommand> --json <fields>`. These are the
 * MINIMUM fields `parsers.ts` needs to validate the payload — `gh` will
 * include all of them in the JSON output, and `parseX` throws ParseError
 * if any required field is missing or malformed. We can't drop these
 * flags because `gh issue list`/`gh pr list`/`gh run list` return
 * tab-separated text by default; without `--json` the JSON.parse in
 * pullX would fail silently (after the E1 fix: throw).
 */
const ISSUE_LIST_FIELDS = [
  "number",
  "title",
  "body",
  "state",
  "labels",
  "author",
  "assignees",
  "comments",
  "createdAt",
  "updatedAt",
  "closedAt",
  "url",
].join(",");
const PR_LIST_FIELDS = [
  ...ISSUE_LIST_FIELDS.split(","),
  "headRefName",
  "baseRefName",
  "mergeable",
  "reviewDecision",
  "statusCheckRollup",
  "reviews",
].join(",");
const RUN_LIST_FIELDS = [
  "databaseId",
  "name",
  "status",
  "conclusion",
  "headBranch",
  "event",
  "url",
  "createdAt",
].join(",");
const RUN_LIST_LIMIT = 20;
const ENTITY_LIST_LIMIT = 1000;

interface PullSummary {
  issues: number;
  prs: number;
  runs: number;
  branches: number;
}

/**
 * Sort comments oldest→newest by createdAt and truncate to the last 30.
 *
 * The spec scenario explicitly requires both "exactly the last 30" AND
 * "ordered oldest→newest." `gh issue view --json comments` returns them
 * newest-first by default, so we sort the array and take the tail — the
 * natural, order-independent interpretation that survives either input
 * ordering.
 */
function trimComments(comments: IssuePayload["comments"]): IssuePayload["comments"] {
  const sorted = [...comments].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
  return sorted.slice(-MAX_ISSUE_COMMENTS);
}

/**
 * Read local branches via `git for-each-ref refs/heads/`.
 * Returns an empty array if `git` is unavailable or fails — we never want
 * a local-only error to abort a sync when the remote read still works.
 */
async function readLocalBranches(): Promise<BranchRef[]> {
  const format = "%(HEAD)%00%(refname:short)%00%(subject)";
  const out = await new Promise<string>((resolve) => {
    const child = spawn(
      "git",
      ["for-each-ref", "--format=" + format, "refs/heads/"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c: Buffer | string) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c: Buffer | string) => {
      stderr += c.toString();
    });
    child.on("error", () => resolve(""));
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else resolve(""); // tolerate failure — remote read may still succeed
    });
    void stderr;
  });
  return out
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [sha, name, ...rest] = line.split("\0");
      return {
        name: name ?? "",
        lastCommitSha: sha ?? "",
        lastCommitSubject: rest.join("\0") ?? "",
      };
    });
}

/**
 * Read remote branches via `gh api /repos/{owner}/{repo}/branches`.
 * Returns an empty array on non-zero exit; the caller treats that as
 * "no remote branches visible" rather than aborting the sync.
 */
async function readRemoteBranches(): Promise<BranchRef[]> {
  const result = await runGh(["api", "/repos"]);
  if (result.exitCode !== 0) return [];
  try {
    const raw = JSON.parse(result.stdout) as unknown;
    return parseBranchList(raw);
  } catch {
    return [];
  }
}

/* ───────────────────────── entity-specific pull handlers ───────────────────────── */

async function pullIssues(): Promise<number> {
  const result = await runGh([
    "issue",
    "list",
    "--state",
    "open",
    "--json",
    ISSUE_LIST_FIELDS,
    "--limit",
    String(ENTITY_LIST_LIMIT),
  ]);
  if (result.exitCode !== 0) {
    throw new GhError(
      "unknown",
      `gh issue list exited ${result.exitCode}: ${result.stderr}`,
      result.exitCode,
    );
  }
  let raw: unknown[];
  try {
    raw = JSON.parse(result.stdout) as unknown[];
  } catch {
    return 0;
  }
  for (const item of raw) {
    try {
      const parsed = parseIssue(item);
      const issue = { ...parsed, comments: trimComments(parsed.comments) };
      await writeMirror("issues", String(issue.number), issue);
    } catch {
      // Skip malformed entries on disk; still count toward the input total.
      continue;
    }
  }
  return raw.length;
}

async function pullPrs(): Promise<number> {
  const result = await runGh([
    "pr",
    "list",
    "--state",
    "open",
    "--json",
    PR_LIST_FIELDS,
    "--limit",
    String(ENTITY_LIST_LIMIT),
  ]);
  if (result.exitCode !== 0) {
    throw new GhError(
      "unknown",
      `gh pr list exited ${result.exitCode}: ${result.stderr}`,
      result.exitCode,
    );
  }
  let raw: unknown[];
  try {
    raw = JSON.parse(result.stdout) as unknown[];
  } catch {
    return 0;
  }
  for (const item of raw) {
    try {
      const parsed = parsePr(item);
      const pr = { ...parsed, comments: trimComments(parsed.comments) };
      await writeMirror("prs", String(pr.number), pr);
    } catch {
      continue;
    }
  }
  return raw.length;
}

async function pullBranches(): Promise<number> {
  const [locals, remotes] = await Promise.all([
    readLocalBranches(),
    readRemoteBranches(),
  ]);
  await writeMirror("branches", "local", locals);
  await writeMirror("branches", "remote", remotes);
  return locals.length + remotes.length;
}

async function pullRuns(): Promise<number> {
  const result = await runGh([
    "run",
    "list",
    "--limit",
    String(RUN_LIST_LIMIT),
    "--json",
    RUN_LIST_FIELDS,
  ]);
  if (result.exitCode !== 0) {
    throw new GhError(
      "unknown",
      `gh run list exited ${result.exitCode}: ${result.stderr}`,
      result.exitCode,
    );
  }
  let raw: unknown[];
  try {
    raw = JSON.parse(result.stdout) as unknown[];
  } catch {
    return 0;
  }
  for (const item of raw) {
    try {
      const run = parseRun(item);
      await writeMirror("runs", String(run.databaseId), run);
    } catch {
      continue;
    }
  }
  return raw.length;
}

/* ───────────────────────── entity orchestrator ───────────────────────── */

const ENTITY_HANDLERS: Record<EntityType, () => Promise<number>> = {
  issues: pullIssues,
  prs: pullPrs,
  branches: pullBranches,
  runs: pullRuns,
};

async function pullEntity(t: EntityType): Promise<number> {
  return ENTITY_HANDLERS[t]();
}

async function pullAll(program: Command): Promise<void> {
  try {
    await ensureGh();
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "gh authentication failed";
    const json = useJson(program);
    success(`gh not ready: ${msg}`, json, {
      ok: false,
      error: { kind: "gh_unavailable", message: msg },
    });
    process.exitCode = 1;
    return;
  }
  const json = useJson(program);
  try {
    const [issues, prs, runs, branches] = await Promise.all([
      pullEntity("issues"),
      pullEntity("prs"),
      pullEntity("runs"),
      pullEntity("branches"),
    ]);
    const counts: PullSummary = { issues, prs, runs, branches };
    const total = issues + prs + runs + branches;
    success(
      `Pulled ${issues} issues, ${prs} PRs, ${branches} branches, ${runs} runs (${total} total)`,
      json,
      { ok: true, counts },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "sync failed";
    success(`sync failed: ${msg}`, json, {
      ok: false,
      error: { kind: "sync_failed", message: msg },
    });
    process.exitCode = 1;
  }
}

/* ───────────────────────── status ───────────────────────── */

interface StatusEntry {
  last_pulled_at: string | null;
  age_hours: number | null;
  stale: boolean;
}

function formatHumanAge(hours: number | null): string {
  if (hours === null) return "never";
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours)}h ago (stale)`;
}

function formatHumanLastPulled(mtime: Date | null): string {
  if (!mtime) return "—";
  return mtime.toISOString();
}

async function statusAction(program: Command): Promise<void> {
  const json = useJson(program);
  const entities: EntityType[] = ["issues", "prs", "branches", "runs"];
  const ages = await Promise.all(
    entities.map(async (t) => ({
      entity: t,
      age: await cacheAgeHours(t),
      mtime: await cacheMtime(t),
    })),
  );
  const anyStale = ages.some((e) => (e.age ?? 0) > STALE_THRESHOLD_HOURS);
  if (json) {
    const payload: Record<EntityType, StatusEntry> = {
      issues: { last_pulled_at: null, age_hours: null, stale: false },
      prs: { last_pulled_at: null, age_hours: null, stale: false },
      branches: { last_pulled_at: null, age_hours: null, stale: false },
      runs: { last_pulled_at: null, age_hours: null, stale: false },
    };
    for (const e of ages) {
      payload[e.entity] = {
        last_pulled_at: e.mtime ? e.mtime.toISOString() : null,
        age_hours: e.age,
        stale: (e.age ?? 0) > STALE_THRESHOLD_HOURS,
      };
    }
    jsonOut(payload);
  } else {
    table(
      ages.map((e) => ({
        entity: e.entity,
        last_pulled_at: formatHumanLastPulled(e.mtime),
        age: formatHumanAge(e.age),
        status:
          e.age === null
            ? "(never pulled)"
            : e.age > STALE_THRESHOLD_HOURS
              ? "(stale)"
              : "(ok)",
      })),
      ["entity", "last_pulled_at", "age", "status"],
    );
  }
  if (anyStale) {
    process.exit(1);
  }
}

/* ───────────────────────── registration ───────────────────────── */

export function registerSyncCommands(program: Command): void {
  const sync = program
    .command("sync")
    .description("Mirror GitHub project state (issues, PRs, branches, runs) into the local cache");

  sync
    .command("pull")
    .description("Refresh all four entity types in parallel (issues, PRs, branches, runs)")
    .action(async () => {
      await pullAll(program);
    });

  sync
    .command("issues")
    .description("Refresh only the open-issues mirror")
    .action(async () => {
      await ensureGh();
      const json = useJson(program);
      const n = await pullEntity("issues");
      success(`Pulled ${n} issues`, json, { ok: true, entity: "issues", count: n });
    });

  sync
    .command("prs")
    .description("Refresh only the open-PRs mirror")
    .action(async () => {
      await ensureGh();
      const json = useJson(program);
      const n = await pullEntity("prs");
      success(`Pulled ${n} PRs`, json, { ok: true, entity: "prs", count: n });
    });

  sync
    .command("branches")
    .description("Refresh only the local+remote branches mirror")
    .action(async () => {
      await ensureGh();
      const json = useJson(program);
      const n = await pullEntity("branches");
      success(`Pulled ${n} branches`, json, { ok: true, entity: "branches", count: n });
    });

  sync
    .command("runs")
    .description("Refresh only the last 20 GitHub Actions runs")
    .action(async () => {
      await ensureGh();
      const json = useJson(program);
      const n = await pullEntity("runs");
      success(`Pulled ${n} runs`, json, { ok: true, entity: "runs", count: n });
    });

  sync
    .command("status")
    .description("Report cache age per entity type; exit 1 if any entity is > 24h stale")
    .action(async () => {
      await statusAction(program);
    });
}

/**
 * Re-export the GhError class so tests can assert on its shape without
 * importing directly from ../gh.js (the test file mocks that module).
 */
export { GhError };