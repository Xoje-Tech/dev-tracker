/**
 * `dt pr <n>` — single-entity push operations against GitHub PRs.
 *
 * Subcommands:
 *   pr <n> comment --body "..."                post a comment
 *   pr <n> review --approve --body "..."      submit an approve review
 *   pr <n> review --request-changes --body "..."   submit a request-changes review
 *   pr <n> review --comment --body "..."      submit a plain comment review
 *
 * Same shape as issue.ts: ensureGh → runGh(op) → 2s sleep → runGh(view) → writeMirror.
 */

import { Command } from "commander";
import { ensureGh, GhError, runGh } from "../gh.js";
import { writeMirror } from "../cache.js";
import { parsePr, type PrPayload } from "../parsers.js";
import { success, useJson } from "../output.js";

const PUSH_REFRESH_DELAY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshPrMirror(n: number): Promise<PrPayload> {
  const result = await runGh(["pr", "view", String(n)]);
  if (result.exitCode !== 0) {
    throw new GhError(
      "unknown",
      `failed to re-pull PR ${n}: exit ${result.exitCode}`,
      result.exitCode,
    );
  }
  const raw = JSON.parse(result.stdout) as unknown;
  const parsed = parsePr(raw);
  await writeMirror("prs", String(n), parsed);
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

  await runGh(["pr", "comment", String(n), "--body", body]);
  await delay(PUSH_REFRESH_DELAY_MS);

  try {
    const refreshed = await refreshPrMirror(n);
    success(`Commented on PR ${n}`, json, {
      ok: true,
      entity: "prs",
      number: n,
      action: "comment",
      state: refreshed.state,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "refresh failed";
    success(`Commented on PR ${n} (refresh failed: ${msg})`, json, {
      ok: false,
      error: { kind: "refresh_failed", message: msg },
      number: n,
      action: "comment",
    });
    process.exitCode = 1;
  }
}

type ReviewAction = "approve" | "request-changes" | "comment";

async function reviewAction(
  program: Command,
  n: number,
  review: ReviewAction,
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

  const flag =
    review === "approve"
      ? "--approve"
      : review === "request-changes"
        ? "--request-changes"
        : "--comment";

  await runGh(["pr", "review", String(n), flag, "--body", body]);
  await delay(PUSH_REFRESH_DELAY_MS);

  try {
    const refreshed = await refreshPrMirror(n);
    const label =
      review === "approve"
        ? "Approved"
        : review === "request-changes"
          ? "Requested changes on"
          : "Reviewed";
    success(`${label} PR ${n}`, json, {
      ok: true,
      entity: "prs",
      number: n,
      action: `review:${review}`,
      state: refreshed.state,
      reviewDecision: refreshed.reviewDecision,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "refresh failed";
    success(`Reviewed PR ${n} (refresh failed: ${msg})`, json, {
      ok: false,
      error: { kind: "refresh_failed", message: msg },
      number: n,
      action: `review:${review}`,
    });
    process.exitCode = 1;
  }
}

export function registerPrCommands(program: Command): void {
  const pr = program
    .command("pr")
    .description("Single-entity push operations against a GitHub pull request");

  pr.command("comment <n>")
    .description("Post a comment on PR <n>")
    .requiredOption("--body <body>", "comment body")
    .action(async (n: string, opts: { body: string }) => {
      await commentAction(program, Number(n), opts.body);
    });

  pr.command("review <n>")
    .description("Submit a review on PR <n> (one of --approve / --request-changes / --comment)")
    .requiredOption("--body <body>", "review body")
    .option("--approve", "approve the PR")
    .option("--request-changes", "request changes on the PR")
    .option("--comment", "submit a plain comment review")
    .action(
      async (
        n: string,
        opts: { body: string; approve?: boolean; requestChanges?: boolean; comment?: boolean },
      ) => {
        let review: ReviewAction;
        if (opts.approve) {
          review = "approve";
        } else if (opts.requestChanges) {
          review = "request-changes";
        } else if (opts.comment) {
          review = "comment";
        } else {
          const json = useJson(program);
          success(
            "must specify one of --approve, --request-changes, or --comment",
            json,
            {
              ok: false,
              error: {
                kind: "invalid_args",
                message: "missing review action flag",
              },
            },
          );
          process.exitCode = 1;
          return;
        }
        await reviewAction(program, Number(n), review, opts.body);
      },
    );
}

export { GhError };