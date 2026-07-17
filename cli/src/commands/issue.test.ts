/**
 * Tests for `dt issue` command group: comment, close, reopen.
 *
 * Each push operation follows the same contract:
 *   1. ensureGh() gate (or fail with a GhError hint)
 *   2. runGh(...) the operation
 *   3. sleep 2000ms (absorb GitHub's eventual consistency)
 *   4. runGh(... view ...) the entity
 *   5. writeMirror("issues", String(n), payload)
 *
 * Mocking strategy mirrors sync.test.ts: vi.mock("../gh.js") and
 * vi.mock("../cache.js"). Tests chdir into a tmpdir so the real
 * writeMirror lands on disk when needed.
 *
 * The 2-second post-push delay is short-circuited via a setTimeout
 * stub installed in beforeEach — production keeps the real 2s sleep,
 * tests resolve it on the next microtask.
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

import { registerIssueCommands } from "./issue.js";
import { GhError } from "../gh.js";

let tmpDir: string;
let originalCwd: string;
let logOutput: string[];
let originalSetTimeout: typeof setTimeout;

/**
 * Stub global setTimeout so any delay >= 1000ms resolves on the next
 * microtask. Production code uses 2000ms for the post-push refresh wait;
 * tests don't want to actually wait 2 seconds per push op.
 */
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
  tmpDir = mkdtempSync(join(tmpdir(), `issue-test-${randomUUID()}`));
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

async function runIssue(
  args: string[],
  opts: { json?: boolean } = {},
): Promise<Command> {
  const program = new Command();
  program
    .name("dt")
    .option("--json", "machine-readable output", false)
    .option("-u, --url <url>", "API base URL", "http://localhost:6789");
  registerIssueCommands(program);
  if (opts.json) {
    process.argv = ["node", "dt", "--json", ...args];
  } else {
    process.argv = ["node", "dt", ...args];
  }
  await program.parseAsync(process.argv);
  return program;
}

/** Standard full issue fixture used across re-pull tests. */
const ISSUE_FIXTURE = {
  number: 10,
  title: "T",
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
};

/* ───────────────────────── dt issue comment ───────────────────────── */

describe("dt issue comment", () => {
  it("aborts with GhError when ensureGh() rejects", async () => {
    ensureGhMock.mockRejectedValueOnce(
      new GhError("not_authenticated", "renew", -1),
    );

    await runIssue(["issue", "comment", "10", "--body", "hello"]);

    expect(runGhMock).not.toHaveBeenCalled();
    expect(writeMirrorMock).not.toHaveBeenCalled();
  });

  it("calls runGh(issue comment 10 --body ...), waits 2s, re-pulls, writes mirror", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(ISSUE_FIXTURE),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runIssue(["issue", "comment", "10", "--body", "hello"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawComment = allArgs.some(
      (a) =>
        a[0] === "issue" &&
        a[1] === "comment" &&
        a[2] === "10" &&
        a.includes("--body") &&
        a.includes("hello"),
    );
    expect(sawComment).toBe(true);
    const sawView = allArgs.some(
      (a) => a[0] === "issue" && a[1] === "view" && a[2] === "10",
    );
    expect(sawView).toBe(true);
    const writes = writeMirrorMock.mock.calls;
    expect(writes.some((c) => c[0] === "issues" && c[1] === "10")).toBe(true);
  });

  it("emits a human-readable success line", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(ISSUE_FIXTURE),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runIssue(["issue", "comment", "10", "--body", "hello"]);

    const out = logOutput.join("\n");
    expect(out).toMatch(/comment|posted|10/i);
  });
});

/* ───────────────────────── dt issue close ───────────────────────── */

describe("dt issue close", () => {
  it("calls runGh(issue close 10), waits 2s, re-pulls, writes mirror with CLOSED", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ ...ISSUE_FIXTURE, state: "CLOSED", closedAt: "2026-07-02T00:00:00Z" }),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runIssue(["issue", "close", "10"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawClose = allArgs.some(
      (a) => a[0] === "issue" && a[1] === "close" && a[2] === "10",
    );
    expect(sawClose).toBe(true);
    const writes = writeMirrorMock.mock.calls;
    const closeWrite = writes.find((c) => c[0] === "issues" && c[1] === "10");
    expect(closeWrite).toBeDefined();
    const payload = closeWrite![2] as { state: string };
    expect(payload.state).toBe("CLOSED");
  });
});

/* ───────────────────────── dt issue reopen ───────────────────────── */

describe("dt issue reopen", () => {
  it("calls runGh(issue reopen 10), waits 2s, re-pulls, writes mirror with OPEN", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(ISSUE_FIXTURE),
        stderr: "",
        exitCode: 0,
      });
    writeMirrorMock.mockResolvedValue(undefined);

    await runIssue(["issue", "reopen", "10"]);

    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawReopen = allArgs.some(
      (a) => a[0] === "issue" && a[1] === "reopen" && a[2] === "10",
    );
    expect(sawReopen).toBe(true);
    const writes = writeMirrorMock.mock.calls;
    const reopenWrite = writes.find((c) => c[0] === "issues" && c[1] === "10");
    expect(reopenWrite).toBeDefined();
    const payload = reopenWrite![2] as { state: string };
    expect(payload.state).toBe("OPEN");
  });
});

/* ───────────────────────── registration ───────────────────────── */

describe("registerIssueCommands", () => {
  it("registers 'issue' on the given program", () => {
    const program = new Command();
    registerIssueCommands(program);
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("issue");
  });

  it("registers comment, close, reopen subcommands", () => {
    const program = new Command();
    registerIssueCommands(program);
    const issueCmd = program.commands.find((c) => c.name() === "issue");
    expect(issueCmd).toBeDefined();
    const subNames = issueCmd!.commands.map((c) => c.name());
    expect(subNames).toEqual(
      expect.arrayContaining(["comment", "close", "reopen"]),
    );
  });
});