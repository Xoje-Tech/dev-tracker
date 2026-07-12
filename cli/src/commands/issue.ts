/**
 * `dt issue <n>` — single-entity push operations against GitHub issues.
 *
 * Subcommands:
 *   issue <n> comment --body "..."   post a comment
 *   issue <n> close                  transition issue to CLOSED
 *   issue <n> reopen                 transition issue to OPEN
 *
 * Every push operation follows the same shape:
 *   1. ensureGh() — fail fast if gh is missing or unauthenticated
 *   2. runGh(opArgs) — execute the operation
 *   3. sleep 2000ms — absorb GitHub's eventual consistency
 *   4. runGh(viewArgs) — re-pull the issue
 *   5. writeMirror("issues", String(n), parsed) — refresh local cache
 *
 * The 2-second sleep is mandatory: GitHub's search/index pipeline lags
 * the mutation by ~1s in practice, and re-pulling immediately returns
 * the pre-mutation state. The delay is a tradeoff we accept for the
 * simpler "single-shot CLI command" UX.
 */

import { Command } from "commander";
import { ensureGh, GhError, runGh } from "../gh.js";
import { writeMirror } from "../cache.js";
import { parseIssue, type IssuePayload } from "../parsers.js";
import { success, useJson } from "../output.js";

const PUSH_REFRESH_DELAY_MS = 2000;

/**
 * Sleep `ms` milliseconds. Wrapped so tests can stub it via fake timers
 * without changing production semantics.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Re-pull a single issue by number and overwrite its mirror file.
 * Returns the parsed payload so callers can assert on the new state.
 *
 * Errors propagate — if the re-pull fails, the caller should not claim
 * success. We do NOT write a half-truthful mirror on failure.
 */
async function refreshIssueMirror(n: number): Promise<IssuePayload> {
  const result = await runGh(["issue", "view", String(n)]);
  if (result.exitCode !== 0) {
    throw new GhError(
      "unknown",
      `failed to re-pull issue ${n}: exit ${result.exitCode}`,
      result.exitCode,
    );
  }
  const raw = JSON.parse(result.stdout) as unknown;
  const parsed = parseIssue(raw);
  await writeMirror("issues", String(n), parsed);
  return parsed;
}

async function commentAction(
  program: Command,
  n: number,
  body: string,
): Promise<void> {
  try {
    await ensureGh();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gh unavailable";
    success(`gh not ready: ${msg}`, useJson(program), {
      ok: false,
      error: { kind: "gh_unavailable", message: msg },
    });
    process.exitCode = 1;
    return;
  }
  const json = useJson(program);

  await runGh(["issue", "comment", String(n), "--body", body]);
  await delay(PUSH_REFRESH_DELAY_MS);

  try {
    const refreshed = await refreshIssueMirror(n);
    success(`Commented on issue ${n}`, json, {
      ok: true,
      entity: "issues",
      number: n,
      action: "comment",
      state: refreshed.state,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "refresh failed";
    success(`Commented on issue ${n} (refresh failed: ${msg})`, json, {
      ok: false,
      error: { kind: "refresh_failed", message: msg },
      number: n,
      action: "comment",
    });
    process.exitCode = 1;
  }
}

async function closeAction(program: Command, n: number): Promise<void> {
  try {
    await ensureGh();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gh unavailable";
    success(`gh not ready: ${msg}`, useJson(program), {
      ok: false,
      error: { kind: "gh_unavailable", message: msg },
    });
    process.exitCode = 1;
    return;
  }
  const json = useJson(program);

  await runGh(["issue", "close", String(n)]);
  await delay(PUSH_REFRESH_DELAY_MS);

  try {
    const refreshed = await refreshIssueMirror(n);
    success(`Closed issue ${n}`, json, {
      ok: true,
      entity: "issues",
      number: n,
      action: "close",
      state: refreshed.state,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "refresh failed";
    success(`Closed issue ${n} (refresh failed: ${msg})`, json, {
      ok: false,
      error: { kind: "refresh_failed", message: msg },
      number: n,
      action: "close",
    });
    process.exitCode = 1;
  }
}

async function reopenAction(program: Command, n: number): Promise<void> {
  try {
    await ensureGh();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gh unavailable";
    success(`gh not ready: ${msg}`, useJson(program), {
      ok: false,
      error: { kind: "gh_unavailable", message: msg },
    });
    process.exitCode = 1;
    return;
  }
  const json = useJson(program);

  await runGh(["issue", "reopen", String(n)]);
  await delay(PUSH_REFRESH_DELAY_MS);

  try {
    const refreshed = await refreshIssueMirror(n);
    success(`Reopened issue ${n}`, json, {
      ok: true,
      entity: "issues",
      number: n,
      action: "reopen",
      state: refreshed.state,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "refresh failed";
    success(`Reopened issue ${n} (refresh failed: ${msg})`, json, {
      ok: false,
      error: { kind: "refresh_failed", message: msg },
      number: n,
      action: "reopen",
    });
    process.exitCode = 1;
  }
}

/**
 * Register the `dt issue <action> <n>` command tree on `program`.
 *
 * Shape: `dt issue comment <n> --body "..." | dt issue close <n> | dt issue reopen <n>`.
 * The action is a subcommand of `issue`; the issue number is the first
 * positional argument of each subcommand.
 */
export function registerIssueCommands(program: Command): void {
  const issue = program
    .command("issue")
    .description("Single-entity push operations against a GitHub issue");

  issue
    .command("comment <n>")
    .description("Post a comment on issue <n>")
    .requiredOption("--body <body>", "comment body")
    .action(async (n: string, opts: { body: string }) => {
      await commentAction(program, Number(n), opts.body);
    });

  issue
    .command("close <n>")
    .description("Close issue <n>")
    .action(async (n: string) => {
      await closeAction(program, Number(n));
    });

  issue
    .command("reopen <n>")
    .description("Reopen issue <n>")
    .action(async (n: string) => {
      await reopenAction(program, Number(n));
    });
}

/**
 * Re-export GhError for tests that want to assert on the class without
 * importing directly from ../gh.js (the test file mocks that module).
 */
export { GhError };