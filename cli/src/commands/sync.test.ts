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
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  statSync,
  utimesSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Tests for the `dt sync` command group: pull, filtered, status.
 *
 * Mocking strategy:
 *   - `../gh.js` → mock runGh + ensureGh so we don't actually spawn gh.
 *   - `./cache.js` → mock writeMirror/readMirror so tests stay filesystem-free.
 *   - We still chdir into a tmpdir so any production code that touches
 *     process.cwd() (e.g. syncRoot) gets a clean slate.
 */

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
  // Type-only exports are not part of the runtime mock surface.
}));

import { registerSyncCommands } from "./sync.js";
import { GhError } from "../gh.js";

let tmpDir: string;
let originalCwd: string;
let logOutput: string[];

beforeEach(() => {
  runGhMock.mockReset();
  ensureGhMock.mockReset();
  writeMirrorMock.mockReset();
  cacheAgeHoursMock.mockReset();
  cacheMtimeMock.mockReset();
  originalCwd = process.cwd();
  tmpDir = mkdtempSync(join(tmpdir(), `sync-test-${randomUUID()}`));
  process.chdir(tmpDir);
  // Capture stdout/stderr so the tests don't pollute test output.
  logOutput = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logOutput.push(args.map((a) => String(a)).join(" "));
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    logOutput.push(args.map((a) => String(a)).join(" "));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

/**
 * Helper: register the sync commands on a fresh program and execute the
 * given argv tail. Returns the program so tests can introspect.
 */
async function runSync(
  args: string[],
  opts: { json?: boolean } = {},
): Promise<Command> {
  const program = new Command();
  program
    .name("dt")
    .option("--json", "machine-readable output", false)
    .option("-u, --url <url>", "API base URL", "http://localhost:3000");
  registerSyncCommands(program);
  if (opts.json) {
    process.argv = ["node", "dt", "--json", ...args];
  } else {
    process.argv = ["node", "dt", ...args];
  }
  await program.parseAsync(process.argv);
  return program;
}

/**
 * Feed canned gh output for a particular gh subcommand.
 * `predicate(args)` should match by the FIRST TWO args only (subcommand path)
 * so callers can use `args[0] === "issue" && args[1] === "list"` etc.
 */
function mockRunGhByPredicate(
  predicate: (args: string[]) => boolean,
  payload: unknown,
  options: { exitCode?: number; stderr?: string } = {},
): void {
  runGhMock.mockImplementation(async (args: string[]) => {
    if (!predicate(args)) {
      throw new Error(
        `Unexpected runGh call: ${JSON.stringify(args)}. Mock predicate did not match.`,
      );
    }
    return {
      stdout: JSON.stringify(payload),
      stderr: options.stderr ?? "",
      exitCode: options.exitCode ?? 0,
    };
  });
}

function mockRunGhRaw(
  predicate: (args: string[]) => boolean,
  rawStdout: string,
  options: { exitCode?: number; stderr?: string } = {},
): void {
  runGhMock.mockImplementation(async (args: string[]) => {
    if (!predicate(args)) {
      throw new Error(
        `Unexpected runGh call: ${JSON.stringify(args)}. Mock predicate did not match.`,
      );
    }
    return {
      stdout: rawStdout,
      stderr: options.stderr ?? "",
      exitCode: options.exitCode ?? 0,
    };
  });
}

/* ───────────────────────── dt sync pull — full mirror ───────────────────────── */

describe("dt sync pull — full mirror of all entity types", () => {
  it("calls ensureGh() before any runGh() call", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    mockRunGhByPredicate(() => true, []);
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    expect(ensureGhMock).toHaveBeenCalledTimes(1);
  });

  it("aborts with GhError when ensureGh() rejects (gh not installed)", async () => {
    ensureGhMock.mockRejectedValueOnce(
      new GhError("not_installed", "Install gh from https://cli.github.com", -1),
    );

    await runSync(["sync", "pull"]);

    // No runGh calls should have been issued once ensureGh failed.
    expect(runGhMock).not.toHaveBeenCalled();
    expect(writeMirrorMock).not.toHaveBeenCalled();
    expect(
      logOutput.some((l) => l.includes("https://cli.github.com")),
    ).toBe(true);
  });

  it("issues 4 runGh calls in parallel (issues, prs, remote-branches, runs)", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    mockRunGhByPredicate(() => true, []);
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    // Exactly 4 runGh calls: issue list, pr list, gh api /repos (remote
    // branches), run list. Local branches use `git` directly and don't
    // count as a runGh call.
    expect(runGhMock).toHaveBeenCalledTimes(4);
    const allArgs = runGhMock.mock.calls.map((c) => c[0] as string[]);
    const sawIssue = allArgs.some(
      (a) => a[0] === "issue" && a[1] === "list",
    );
    const sawPr = allArgs.some((a) => a[0] === "pr" && a[1] === "list");
    const sawBranch = allArgs.some(
      (a) => a[0] === "api" && a[1]?.startsWith("/repos"),
    );
    const sawRuns = allArgs.some((a) => a[0] === "run" && a[1] === "list");
    expect(sawIssue).toBe(true);
    expect(sawPr).toBe(true);
    expect(sawBranch).toBe(true);
    expect(sawRuns).toBe(true);
  });

  it("parses each open issue and writes one mirror file per issue keyed by number", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    const issues = [
      {
        number: 10,
        title: "First issue",
        body: "body1",
        state: "OPEN",
        labels: [{ name: "bug" }],
        author: { login: "alice" },
        assignees: [],
        comments: [],
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-02T00:00:00Z",
        closedAt: null,
        url: "https://github.com/Xoje-Tech/dev-tracker/issues/10",
      },
      {
        number: 11,
        title: "Second issue",
        body: null,
        state: "OPEN",
        labels: [],
        author: { login: "bob" },
        assignees: [],
        comments: [],
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-02T00:00:00Z",
        closedAt: null,
        url: "https://github.com/Xoje-Tech/dev-tracker/issues/11",
      },
    ];
    // Default mock matches everything; configure each call by predicate.
    let issueSeen = false;
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "issue" && args[1] === "list") {
        issueSeen = true;
        return {
          stdout: JSON.stringify(issues),
          stderr: "",
          exitCode: 0,
        };
      }
      if (args[0] === "pr" && args[1] === "list") {
        return { stdout: "[]", stderr: "", exitCode: 0 };
      }
      if (args[0] === "api" && args[1] === "/repos") {
        return { stdout: "[]", stderr: "", exitCode: 0 };
      }
      if (args[0] === "run" && args[1] === "list") {
        return { stdout: "[]", stderr: "", exitCode: 0 };
      }
      throw new Error(`Unexpected gh args: ${JSON.stringify(args)}`);
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    expect(issueSeen).toBe(true);
    const issueWrites = writeMirrorMock.mock.calls.filter(
      (c) => c[0] === "issues",
    );
    expect(issueWrites).toHaveLength(2);
    const keys = issueWrites.map((c) => c[1] as string).sort();
    expect(keys).toEqual(["10", "11"]);
  });

  it("truncates issue comments to the last 30, ordered oldest→newest", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    // Strictly increasing timestamps so the spec's "ordered oldest→newest"
    // assertion is unambiguous. `gh` returns newest-first by default, so the
    // implementation must take the last 30 AND reverse to satisfy the spec.
    const allComments = Array.from({ length: 50 }, (_, i) => ({
      author: { login: `user${i}` },
      body: `comment ${i}`,
      createdAt: `2026-07-01T${String(i).padStart(2, "0")}:00:00Z`,
    }));
    const issue = {
      number: 42,
      title: "Heated",
      body: null,
      state: "OPEN",
      labels: [],
      author: { login: "alice" },
      assignees: [],
      comments: allComments,
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-02T00:00:00Z",
      closedAt: null,
      url: "https://github.com/Xoje-Tech/dev-tracker/issues/42",
    };
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "issue" && args[1] === "list")
        return {
          stdout: JSON.stringify([issue]),
          stderr: "",
          exitCode: 0,
        };
      return { stdout: "[]", stderr: "", exitCode: 0 };
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    const writes = writeMirrorMock.mock.calls.filter(
      (c) => c[0] === "issues" && c[1] === "42",
    );
    expect(writes).toHaveLength(1);
    const payload = writes[0]![2] as { comments: { body: string }[] };
    expect(payload.comments).toHaveLength(30);
    // Spec: oldest→newest → the first element should be the oldest of the
    // LAST 30. We gave 50 numbered 0..49, so the last 30 are 20..49. They
    // should be ordered 20..49 in payload.comments (oldest first).
    expect(payload.comments[0]!.body).toBe("comment 20");
    expect(payload.comments[29]!.body).toBe("comment 49");
  });

  it("writes local and remote branches as two separate mirror files (no per-branch files)", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "api" && args[1] === "/repos") {
        // Single concatenated payload: branch list. We mock local and remote
        // in the SAME gh api call for simplicity — production code splits
        // based on a different field. Here we just verify that *some* write
        // to branches/local and branches/remote happens.
        return {
          stdout: JSON.stringify([
            { name: "main", lastCommit: { sha: "abc", subject: "Initial" } },
          ]),
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "[]", stderr: "", exitCode: 0 };
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    const localWrite = writeMirrorMock.mock.calls.find(
      (c) => c[0] === "branches" && c[1] === "local",
    );
    const remoteWrite = writeMirrorMock.mock.calls.find(
      (c) => c[0] === "branches" && c[1] === "remote",
    );
    expect(localWrite).toBeDefined();
    expect(remoteWrite).toBeDefined();
  });

  it("writes one mirror file per Actions run keyed by databaseId", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    const runs = Array.from({ length: 20 }, (_, i) => ({
      databaseId: 1000 + i,
      name: `ci-${i}`,
      status: "completed",
      conclusion: "success",
      headBranch: "main",
      event: "push",
      url: `https://github.com/Xoje-Tech/dev-tracker/actions/runs/${1000 + i}`,
      createdAt: "2026-07-09T00:00:00Z",
    }));
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "run" && args[1] === "list") {
        return {
          stdout: JSON.stringify(runs),
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "[]", stderr: "", exitCode: 0 };
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    const runWrites = writeMirrorMock.mock.calls.filter(
      (c) => c[0] === "runs",
    );
    expect(runWrites).toHaveLength(20);
    const ids = runWrites
      .map((c) => Number(c[1] as string))
      .sort((a, b) => a - b);
    expect(ids[0]).toBe(1000);
    expect(ids[19]).toBe(1019);
  });

  it("outputs a human-readable summary line with counts per entity type", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "issue" && args[1] === "list")
        return { stdout: JSON.stringify([{ number: 1 }]), stderr: "", exitCode: 0 };
      if (args[0] === "pr" && args[1] === "list")
        return { stdout: JSON.stringify([{ number: 2 }, { number: 3 }]), stderr: "", exitCode: 0 };
      if (args[0] === "run" && args[1] === "list")
        return { stdout: JSON.stringify([{ databaseId: 9 }]), stderr: "", exitCode: 0 };
      return { stdout: "[]", stderr: "", exitCode: 0 };
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"]);

    const summary = logOutput.join("\n");
    expect(summary).toMatch(/Pulled.*1.*issues?/);
    expect(summary).toMatch(/2.*PRs/);
    expect(summary).toMatch(/1.*run/);
  });

  it("outputs JSON summary with per-entity counts when --json is set", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async () => ({
      stdout: "[]",
      stderr: "",
      exitCode: 0,
    }));
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "pull"], { json: true });

    const jsonLine = logOutput.find((l) => l.startsWith("{") || l.startsWith("["));
    expect(jsonLine).toBeDefined();
    const parsed = JSON.parse(jsonLine!);
    expect(parsed).toMatchObject({
      ok: true,
      counts: expect.objectContaining({
        issues: expect.any(Number),
        prs: expect.any(Number),
        runs: expect.any(Number),
        branches: expect.any(Number),
      }),
    });
  });
});

/* ───────────────────────── dt sync filtered subcommands (issues|branches|prs|runs) ───────────────────────── */

describe("dt sync filtered subcommands", () => {
  it("dt sync issues refreshes ONLY the issues mirror (no PR/run/branch writes)", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "issue" && args[1] === "list") {
        return {
          stdout: JSON.stringify([
            {
              number: 7,
              title: "Only issues",
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
            },
          ]),
          stderr: "",
          exitCode: 0,
        };
      }
      throw new Error(
        `dt sync issues must not call gh for ${JSON.stringify(args)}`,
      );
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "issues"]);

    expect(runGhMock).toHaveBeenCalledTimes(1);
    expect(runGhMock.mock.calls[0]![0] as string[]).toEqual([
      "issue",
      "list",
    ]);
    const writes = writeMirrorMock.mock.calls;
    expect(writes.every((c) => c[0] === "issues")).toBe(true);
  });

  it("dt sync prs refreshes ONLY the PR mirror", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "pr" && args[1] === "list") {
        return { stdout: "[]", stderr: "", exitCode: 0 };
      }
      throw new Error(
        `dt sync prs must not call gh for ${JSON.stringify(args)}`,
      );
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "prs"]);

    expect(runGhMock).toHaveBeenCalledTimes(1);
    const writes = writeMirrorMock.mock.calls;
    expect(writes.every((c) => c[0] === "prs")).toBe(true);
  });

  it("dt sync branches refreshes ONLY local+remote branch mirrors", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "api" && args[1] === "/repos") {
        return { stdout: "[]", stderr: "", exitCode: 0 };
      }
      throw new Error(
        `dt sync branches must not call gh for ${JSON.stringify(args)}`,
      );
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "branches"]);

    expect(runGhMock).toHaveBeenCalledTimes(1);
    const writes = writeMirrorMock.mock.calls;
    expect(writes.some((c) => c[0] === "branches" && c[1] === "local")).toBe(true);
    expect(writes.some((c) => c[0] === "branches" && c[1] === "remote")).toBe(true);
    // No issue/pr/run writes.
    expect(writes.some((c) => c[0] === "issues")).toBe(false);
    expect(writes.some((c) => c[0] === "prs")).toBe(false);
    expect(writes.some((c) => c[0] === "runs")).toBe(false);
  });

  it("dt sync runs refreshes ONLY the Actions runs mirror", async () => {
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockImplementation(async (args: string[]) => {
      if (args[0] === "run" && args[1] === "list") {
        return { stdout: "[]", stderr: "", exitCode: 0 };
      }
      throw new Error(
        `dt sync runs must not call gh for ${JSON.stringify(args)}`,
      );
    });
    writeMirrorMock.mockResolvedValue(undefined);

    await runSync(["sync", "runs"]);

    expect(runGhMock).toHaveBeenCalledTimes(1);
    const writes = writeMirrorMock.mock.calls;
    expect(writes.every((c) => c[0] === "runs")).toBe(true);
  });

  it("filtered subcommand does NOT touch other entity directories' mtime on disk", async () => {
    // Real-filesystem test: pre-seed a PR mirror file, run `dt sync issues`,
    // and assert the PR mirror file's mtime is unchanged. This test needs
    // the REAL writeMirror to land on disk so we can observe the issue file
    // and the unchanged PR file — vi.doUnmock swaps out the cache.js mock
    // for the duration of this test only, and we re-import sync with the
    // unmocked cache module so the real writeMirror runs.
    ensureGhMock.mockResolvedValueOnce(undefined);
    runGhMock.mockResolvedValueOnce({
      stdout: JSON.stringify([
        {
          number: 7,
          title: "Only issues",
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
        },
      ]),
      stderr: "",
      exitCode: 0,
    });

    // Pre-seed a PR mirror under the real .dev-tracker/sync/prs/.
    const prsDir = join(tmpDir, ".dev-tracker", "sync", "prs");
    require("node:fs").mkdirSync(prsDir, { recursive: true });
    const prPath = join(prsDir, "55.json");
    writeFileSync(prPath, '{"number":55}');
    const oneHourAgo = new Date(Date.now() - 3600_000);
    utimesSync(prPath, oneHourAgo, oneHourAgo);
    const beforeMtime = statSync(prPath).mtime.getTime();

    // Unmock cache.js so writeMirror hits the real filesystem.
    vi.doUnmock("../cache.js");
    try {
      // Re-import sync with the unmocked cache module — vi.resetModules()
      // discards the cached import so the next import picks up the real one.
      vi.resetModules();
      const { registerSyncCommands: registerSyncCommandsReal } = await import(
        "./sync.js"
      );
      const program = new Command();
      program.name("dt").option("--json", "machine-readable output", false);
      registerSyncCommandsReal(program);
      process.argv = ["node", "dt", "sync", "issues"];
      await program.parseAsync(process.argv);
    } finally {
      // Restore the mock for the rest of the suite.
      vi.doMock("../cache.js", () => ({
        writeMirror: (...args: unknown[]) => writeMirrorMock(...args),
        readMirror: (...args: unknown[]) => vi.fn()(args),
        cacheAgeHours: (...args: unknown[]) => cacheAgeHoursMock(...args),
        cacheMtime: (...args: unknown[]) => cacheMtimeMock(...args),
      }));
    }

    const afterMtime = statSync(prPath).mtime.getTime();
    expect(afterMtime).toBe(beforeMtime);
    // Also assert that issues WAS written.
    const issuesDir = join(tmpDir, ".dev-tracker", "sync", "issues");
    expect(existsSync(join(issuesDir, "7.json"))).toBe(true);
  });
});

/* ───────────────────────── dt sync status — cache age per entity ───────────────────────── */

describe("dt sync status — cache age report", () => {
  it("queries cacheAgeHours for each of the four entity types", async () => {
    cacheAgeHoursMock.mockResolvedValue(2.0);

    await runSync(["sync", "status"]);

    const called = new Set(
      cacheAgeHoursMock.mock.calls.map((c) => c[0] as string),
    );
    expect(called.has("issues")).toBe(true);
    expect(called.has("prs")).toBe(true);
    expect(called.has("branches")).toBe(true);
    expect(called.has("runs")).toBe(true);
  });

  it("renders a human-readable table with columns entity | last_pulled_at | age | status", async () => {
    cacheAgeHoursMock.mockResolvedValue(2.0);

    await runSync(["sync", "status"]);

    const out = logOutput.join("\n");
    expect(out).toMatch(/entity/i);
    expect(out).toMatch(/last_pulled_at|last pulled/i);
    expect(out).toMatch(/age/i);
    expect(out).toMatch(/status/i);
    expect(out).toMatch(/issues/);
    expect(out).toMatch(/prs/);
  });

  it("marks an entity as (stale) and sets exit code 1 if age > 24h", async () => {
    cacheAgeHoursMock.mockImplementation(async (t: string) => {
      if (t === "issues") return 30;
      if (t === "prs") return 2;
      if (t === "branches") return null;
      if (t === "runs") return 5;
      return null;
    });
    // process.exit is called by the action — capture and stub.
    const exitMock = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await runSync(["sync", "status"]);

    const out = logOutput.join("\n");
    expect(out).toMatch(/issues.*stale/s);
    // PRs at 2h should NOT be marked stale.
    expect(out).not.toMatch(/prs.*stale/s);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it("renders JSON output mapping each entity to { last_pulled_at, age_hours, stale } when --json is set", async () => {
    cacheAgeHoursMock.mockImplementation(async (t: string) => {
      if (t === "issues") return 2.0;
      if (t === "prs") return 30.0;
      if (t === "branches") return null;
      if (t === "runs") return 5.0;
      return null;
    });
    vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

    await runSync(["sync", "status"], { json: true });

    const jsonLine = logOutput.find((l) => l.startsWith("{"));
    expect(jsonLine).toBeDefined();
    const parsed = JSON.parse(jsonLine!);
    expect(parsed.issues).toMatchObject({
      age_hours: 2.0,
      stale: false,
    });
    expect(parsed.prs).toMatchObject({
      age_hours: 30.0,
      stale: true,
    });
    expect(parsed.branches).toMatchObject({
      last_pulled_at: null,
      stale: false,
    });
  });

  it("treats null age (no cache yet) as NOT stale, with last_pulled_at null", async () => {
    cacheAgeHoursMock.mockResolvedValue(null);

    await runSync(["sync", "status"]);

    const out = logOutput.join("\n");
    expect(out).not.toMatch(/stale/);
  });
});

/* ───────────────────────── registration ───────────────────────── */

describe("registerSyncCommands", () => {
  it("registers a 'sync' subcommand on the given program", () => {
    const program = new Command();
    registerSyncCommands(program);
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("sync");
  });

  it("registers pull / issues / branches / prs / status subcommands under sync", () => {
    const program = new Command();
    registerSyncCommands(program);
    const syncCmd = program.commands.find((c) => c.name() === "sync");
    expect(syncCmd).toBeDefined();
    const subNames = syncCmd!.commands.map((c) => c.name());
    expect(subNames).toEqual(
      expect.arrayContaining(["pull", "issues", "branches", "prs", "runs", "status"]),
    );
  });
});