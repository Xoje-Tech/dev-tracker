/**
 * Tests for `dt pr` command group: comment, review (approve/request-changes/comment).
 *
 * Same push pattern as `dt issue`:
 *   1. ensureGh() gate
 *   2. runGh(...) the operation
 *   3. sleep 2000ms
 *   4. runGh(view) the PR
 *   5. writeMirror("prs", String(n), payload)
 *
 * Mocks mirror sync.test.ts and issue.test.ts. The 2s post-push delay
 * is short-circuited via setTimeout stub installed in beforeEach.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { Command } from "commander";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const runGhMock: Mock = vi.fn();
const ensureGhMock: Mock = vi.fn();

vi.mock("../gh.js", () => ({
  runGh: (...args: unknown[]) => runGhMock(...args),
  ensureGh: (...args: unknown[]) => ensureGhMock(...args),
  GhError: class GhError extends Error {
    constructor(
      public readonly kind: string,
      public readonly hint: string,
      public readonly exitCode: number,
    ) {
      super(`gh ${kind}: ${hint}`);
      this.name = "GhError";
    }
  },
}));

const writeMirrorMock: Mock = vi.fn();
const cacheAgeHoursMock: Mock = vi.fn();
const cacheMtimeMock: Mock = vi.fn();

vi.mock("../cache.js", () => ({
  writeMirror: (...args: unknown[]) => writeMirrorMock(...args),
  readMirror: (...args: unknown[]) => vi.fn()(args),
  cacheAgeHours: (...args: unknown[]) => cacheAgeHoursMock(...args),
  cacheMtime: (...args: unknown[]) => cacheMtimeMock(...args),
}));

import { registerPrCommands } from "./pr.js";
import { GhError } from "../gh.js";

let tmpDir: string;
let originalCwd: string;
let logOutput: string[];
let originalSetTimeout: typeof setTimeout;

function stubLongTimers(): void {
  originalSetTimeout = global.setTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).setTimeout = (fn: () => void, ms?: number, ...rest: unknown[]) => {
    if (typeof ms === "number" && ms >= 1000) {
      return Promise.resolve().then(fn) as unknown as ReturnType<typeof setTimeout>;
    }
    return originalSetTimeout(fn, ms, ...rest);
  };
}

function restoreTimers(): void {
  if (originalSetTimeout) {
    global.setTimeout = originalSetTimeout;
  }
}

beforeEach(() => {
  runGhMock.mockReset();
  ensureGhMock.mockReset();
  writeMirrorMock.mockReset();
  cacheAgeHoursMock.mockReset();
  cacheMtimeMock.mockReset();
  originalCwd = process.cwd();
  tmpDir = mkdtempSync(join(tmpdir(), `pr-test-${randomUUID()}`));
  process.chdir(tmpDir);
  logOutput = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logOutput.push(args.map((a) => String(a)).join(" "));
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    logOutput.push(args.map((a) => String(a)).join(" "));
  });
  stubLongTimers();
});

afterEach(() => {
  restoreTimers();
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

async function runPr(
  args: string[],
  opts: { json?: boolean } = {},
): Promise<Command> {
  const program = new Command();
  program
    .name("dt")
    .option("--json", "machine-readable output", false)
    .option("-u, --url <url>", "API base URL", "http://localhost:6789");
  registerPrCommands(program);
  if (opts.json) {
    process.argv = ["node", "dt", "--json", ...args];
  } else {
    process.argv = ["node", "dt", ...args];
  }
  await program.parseAsync(process.argv);
  return program;
}

/** Standard full PR fixture used across re-pull tests. */
const PR_FIXTURE = {
  number: 55,
  title: "Feature: x",
  body: null,
  state: "OPEN",
  labels: [],
  author: { login: "a" },
  assignees: [],
  comments: [],
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  closedAt: null,
  url: "u",
  headRefName: "feat/x",
  baseRefName: "main",
  mergeable: "MERGEABLE",
  reviewDecision: null,
  statusCheckRollup: null,
  reviews: [],
};

/* ───────────────────────── dt pr comment ───────────────────────── */

describe("dt pr comment", () => {
  it("aborts with GhError when ensureGh() rejects", async () => {
    ensureGhMock.mockRejectedValueOnce(
      new GhError("not_authenticated", "renew", -1),
    );

    await runPr(["pr", "comment", "55", "--body", "LGTM"]);

    expect(runGhMock).not.toHaveBeenCalled();
    expect(writeMirrorMock).not.toHaveBeenCalled();
  });

  it("calls runGh(pr comment 55 --body ...), waits 2s, re-pulls, writes mirror", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(PR_FIXTURE),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runPr(["pr", "comment", "55", "--body", "LGTM"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawComment = allArgs.some(
      (a) =>
        a[0] === "pr" &&
        a[1] === "comment" &&
        a[2] === "55" &&
        a.includes("--body") &&
        a.includes("LGTM"),
    );
    expect(sawComment).toBe(true);
    const sawView = allArgs.some(
      (a) => a[0] === "pr" && a[1] === "view" && a[2] === "55",
    );
    expect(sawView).toBe(true);
    const writes = writeMirrorMock.mock.calls;
    expect(writes.some((c) => c[0] === "prs" && c[1] === "55")).toBe(true);
  });
});

/* ───────────────────────── dt pr review ───────────────────────── */

describe("dt pr review", () => {
  it("calls runGh(pr review 55 --approve --body ...) for --approve", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          ...PR_FIXTURE,
          reviewDecision: "APPROVED",
        }),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runPr(["pr", "review", "55", "--approve", "--body", "LGTM"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawApprove = allArgs.some(
      (a) =>
        a[0] === "pr" &&
        a[1] === "review" &&
        a[2] === "55" &&
        a.includes("--approve") &&
        a.includes("--body") &&
        a.includes("LGTM"),
    );
    expect(sawApprove).toBe(true);
    const writes = writeMirrorMock.mock.calls;
    const reviewWrite = writes.find((c) => c[0] === "prs" && c[1] === "55");
    expect(reviewWrite).toBeDefined();
    const payload = reviewWrite![2] as { reviewDecision: string };
    expect(payload.reviewDecision).toBe("APPROVED");
  });

  it("calls runGh(pr review 55 --request-changes --body ...) for --request-changes", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          ...PR_FIXTURE,
          reviewDecision: "CHANGES_REQUESTED",
        }),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runPr(["pr", "review", "55", "--request-changes", "--body", "Needs fix"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawRequestChanges = allArgs.some(
      (a) =>
        a[0] === "pr" &&
        a[1] === "review" &&
        a[2] === "55" &&
        a.includes("--request-changes"),
    );
    expect(sawRequestChanges).toBe(true);
    const writes = writeMirrorMock.mock.calls;
    const reviewWrite = writes.find((c) => c[0] === "prs" && c[1] === "55");
    expect(reviewWrite).toBeDefined();
    const payload = reviewWrite![2] as { reviewDecision: string };
    expect(payload.reviewDecision).toBe("CHANGES_REQUESTED");
  });

  it("calls runGh(pr review 55 --comment --body ...) for --comment (plain review)", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(PR_FIXTURE),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runPr(["pr", "review", "55", "--comment", "--body", "Question"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawCommentReview = allArgs.some(
      (a) =>
        a[0] === "pr" &&
        a[1] === "review" &&
        a[2] === "55" &&
        a.includes("--comment"),
    );
    expect(sawCommentReview).toBe(true);
  });
});

/* ───────────────────────── registration ───────────────────────── */

describe("registerPrCommands", () => {
  it("registers 'pr' on the given program", () => {
    const program = new Command();
    registerPrCommands(program);
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("pr");
  });

  it("registers comment and review subcommands", () => {
    const program = new Command();
    registerPrCommands(program);
    const prCmd = program.commands.find((c) => c.name() === "pr");
    expect(prCmd).toBeDefined();
    const subNames = prCmd!.commands.map((c) => c.name());
    expect(subNames).toEqual(
      expect.arrayContaining(["comment", "review"]),
    );
  });
});