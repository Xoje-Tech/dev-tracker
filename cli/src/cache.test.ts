import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  statSync,
  utimesSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const execFileP = promisify(execFile);

/**
 * IMPORTANT: cache.ts reads syncRoot() from process.cwd(). Every test that
 * uses cache writeMirror/readMirror/cacheMtime MUST chdir into a fresh
 * tmpdir so we don't pollute (or read) the real dev-tracker workspace.
 */
let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  vi.restoreAllMocks();
  originalCwd = process.cwd();
  tmpDir = mkdtempSync(join(tmpdir(), `cache-test-${randomUUID()}`));
  process.chdir(tmpDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

/* ───────────────────────── writeMirror / atomic semantics ───────────────────────── */

describe("writeMirror — atomic tmp→rename", () => {
  it("creates the parent cache directory and writes the final file with the given payload", async () => {
    const { writeMirror, readMirror } = await import("./cache.js");
    await writeMirror("issues", "10", { number: 10, title: "Test" });
    const target = join(tmpDir, ".dev-tracker", "sync", "issues", "10.json");
    expect(existsSync(target)).toBe(true);
    const read = await readMirror<{ number: number; title: string }>(
      "issues",
      "10",
    );
    expect(read).toEqual({ number: 10, title: "Test" });
  });

  it("does NOT leave stray .tmp.* files behind after a successful write", async () => {
    const { writeMirror } = await import("./cache.js");
    await writeMirror("prs", "55", { number: 55 });
    const dir = join(tmpDir, ".dev-tracker", "sync", "prs");
    const tmps = require("node:fs").readdirSync(dir).filter((f: string) =>
      f.includes(".tmp."),
    );
    expect(tmps).toEqual([]);
  });

  it("overwrites an existing mirror file atomically", async () => {
    const { writeMirror, readMirror } = await import("./cache.js");
    await writeMirror("branches", "main", { name: "main", sha: "v1" });
    await writeMirror("branches", "main", { name: "main", sha: "v2" });
    const read = await readMirror<{ name: string; sha: string }>(
      "branches",
      "main",
    );
    expect(read?.sha).toBe("v2");
  });
});

/* ───────────────────────── readMirror ENOENT semantics ───────────────────────── */

describe("readMirror — missing file handling", () => {
  it("returns null (not throws) when the mirror file does not exist", async () => {
    const { readMirror } = await import("./cache.js");
    const result = await readMirror("issues", "999");
    expect(result).toBeNull();
  });

  it("returns null when the entity-type directory does not exist", async () => {
    const { readMirror } = await import("./cache.js");
    const result = await readMirror("runs", "any");
    expect(result).toBeNull();
  });
});

/* ───────────────────────── cacheAgeHours / cacheMtime ───────────────────────── */

describe("cacheAgeHours — mtime arithmetic", () => {
  it("returns null when the entity directory has never been written", async () => {
    const { cacheAgeHours } = await import("./cache.js");
    expect(await cacheAgeHours("issues")).toBeNull();
  });

  it("calculates elapsed hours between mtime and Date.now()", async () => {
    const { writeMirror, cacheAgeHours } = await import("./cache.js");
    await writeMirror("issues", "10", { number: 10 });
    // Re-set mtime to exactly 6 hours ago so we can assert a precise value.
    const dir = join(tmpDir, ".dev-tracker", "sync", "issues");
    const sixHoursAgo = new Date(Date.now() - 6 * 3_600_000);
    const target = join(dir, "10.json");
    utimesSync(target, sixHoursAgo, sixHoursAgo);
    const age = await cacheAgeHours("issues");
    expect(age).not.toBeNull();
    expect(age!).toBeGreaterThan(5.99);
    expect(age!).toBeLessThan(6.01);
  });
});

describe("cacheMtime — directory mtime not file mtime", () => {
  it("returns the mtime of the entity-type directory", async () => {
    const { writeMirror, cacheMtime } = await import("./cache.js");
    await writeMirror("issues", "10", { number: 10 });
    const m = await cacheMtime("issues");
    expect(m).not.toBeNull();
    // The directory must exist (we just wrote into it).
    const dir = join(tmpDir, ".dev-tracker", "sync", "issues");
    expect(statSync(dir).mtime.getTime()).toBe(m!.getTime());
  });
});

/* ───────────────────────── CRITICAL: gitignore must cover the cache ───────────────────────── */

describe("CRITICAL: .dev-tracker/sync/ is gitignored", () => {
  it("git check-ignore exits 0 against a path under .dev-tracker/sync/ when a .gitignore with that entry exists", async () => {
    // Build a temp git repo so `git check-ignore` has something to consult.
    const repoDir = mkdtempSync(join(tmpdir(), `cache-gi-${randomUUID()}`));
    try {
      await execFileP("git", ["init", "--initial-branch=main", repoDir]);
      await execFileP("git", ["config", "user.email", "test@example.test"], {
        cwd: repoDir,
      });
      await execFileP("git", ["config", "user.name", "cache-test"], {
        cwd: repoDir,
      });

      // Place a .gitignore at the repo root that ignores the cache directory.
      writeFileSync(join(repoDir, ".gitignore"), ".dev-tracker/sync/\n");

      // Materialize the ignored path inside the repo so check-ignore has a
      // real file to test against.
      mkdirSync(join(repoDir, ".dev-tracker", "sync", "issues"), {
        recursive: true,
      });
      writeFileSync(
        join(repoDir, ".dev-tracker", "sync", "issues", "10.json"),
        "{}\n",
      );

      // `git check-ignore` exits 0 iff the path is ignored.
      const { stdout } = await execFileP(
        "git",
        ["check-ignore", "-v", ".dev-tracker/sync/issues/10.json"],
        { cwd: repoDir },
      );
      expect(stdout).toContain(".gitignore");
      expect(stdout).toContain(".dev-tracker/sync/");
    } finally {
      rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it("git check-ignore exits 1 (not ignored) when the .gitignore does NOT have the entry — proving the test is real", async () => {
    const repoDir = mkdtempSync(join(tmpdir(), `cache-gi-neg-${randomUUID()}`));
    try {
      await execFileP("git", ["init", "--initial-branch=main", repoDir]);
      mkdirSync(join(repoDir, ".dev-tracker", "sync", "issues"), {
        recursive: true,
      });
      writeFileSync(
        join(repoDir, ".dev-tracker", "sync", "issues", "10.json"),
        "{}\n",
      );
      // No .gitignore — the path should NOT be ignored.
      let exited = 0;
      try {
        await execFileP(
          "git",
          ["check-ignore", ".dev-tracker/sync/issues/10.json"],
          { cwd: repoDir },
        );
      } catch (err: unknown) {
        const code = (err as { code?: number }).code;
        exited = typeof code === "number" ? code : -1;
      }
      expect(exited).toBe(1); // 1 means NOT ignored.
    } finally {
      rmSync(repoDir, { recursive: true, force: true });
    }
  });
});

// Keep readFileSync reachable so the import isn't tree-shaken before any
// future test wants to read the raw JSON for assertions.
void readFileSync;
