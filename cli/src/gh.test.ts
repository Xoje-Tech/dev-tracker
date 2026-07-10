import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { EventEmitter } from "node:events";

// Mock child_process.spawn at the module level so gh.ts picks up the fake.
const spawnMock: Mock = vi.fn();
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

// Import AFTER the mock is registered.
import {
  GhError,
  ensureGh,
  parseGhError,
  runGh,
} from "./gh.js";

interface FakeProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: Mock;
}

/**
 * Build a fake child process that mimics enough of node:child_process.ChildProcess
 * for gh.ts to talk to it. Returns the EventEmitter + helpers to feed
 * stdout/stderr and to fire 'close' / 'error'.
 */
function makeFakeProcess(): {
  proc: FakeProcess;
  emitStdout: (chunk: string) => void;
  emitStderr: (chunk: string) => void;
  finish: (exitCode: number) => void;
  failWith: (err: NodeJS.ErrnoException) => void;
} {
  const proc = new EventEmitter() as FakeProcess;
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = vi.fn();
  return {
    proc,
    emitStdout: (chunk) => proc.stdout.emit("data", Buffer.from(chunk)),
    emitStderr: (chunk) => proc.stderr.emit("data", Buffer.from(chunk)),
    finish: (exitCode) => proc.emit("close", exitCode),
    failWith: (err) => proc.emit("error", err),
  };
}

beforeEach(() => {
  spawnMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runGh", () => {
  it("spawns 'gh' with the given args and returns captured stdout+stderr+exit", async () => {
    const fake = makeFakeProcess();
    spawnMock.mockReturnValueOnce(fake.proc);
    const promise = runGh(["issue", "list", "--json", "number"]);
    fake.emitStdout('[{"number":1}]');
    fake.emitStderr("");
    fake.finish(0);
    const result = await promise;
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0]![0]).toBe("gh");
    expect(spawnMock.mock.calls[0]![1]).toEqual([
      "issue",
      "list",
      "--json",
      "number",
    ]);
    expect(result.stdout).toBe('[{"number":1}]');
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
  });

  it("does NOT throw on non-zero exit; surfaces exitCode + stderr to the caller", async () => {
    const fake = makeFakeProcess();
    spawnMock.mockReturnValueOnce(fake.proc);
    const promise = runGh(["issue", "view", "999"]);
    fake.emitStderr("gh: Not Found (404)\n");
    fake.finish(404);
    const result = await promise;
    expect(result.exitCode).toBe(404);
    expect(result.stderr).toContain("Not Found");
  });

  it("rejects with GhError(not_installed) when spawn emits ENOENT", async () => {
    const fake = makeFakeProcess();
    spawnMock.mockReturnValueOnce(fake.proc);
    const promise = runGh(["--version"]);
    const err = new Error("spawn gh ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    fake.failWith(err);
    await expect(promise).rejects.toBeInstanceOf(GhError);
    await expect(promise).rejects.toMatchObject({
      kind: "not_installed",
      hint: expect.stringContaining("https://cli.github.com"),
    });
  });

  it("rejects with GhError(unknown, timeout) when the process runs longer than timeoutMs", async () => {
    vi.useFakeTimers();
    const fake = makeFakeProcess();
    spawnMock.mockReturnValueOnce(fake.proc);
    const promise = runGh(["issue", "list"], { timeoutMs: 1000 });
    // Let the timer fire.
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).rejects.toBeInstanceOf(GhError);
    await expect(promise).rejects.toMatchObject({
      kind: "unknown",
      hint: expect.stringContaining("timed out after 1000ms"),
    });
    expect(fake.proc.kill).toHaveBeenCalledWith("SIGTERM");
  });
});

describe("ensureGh", () => {
  it("resolves without throwing when 'gh --version' + 'gh auth status' both exit 0", async () => {
    const fakeVersion = makeFakeProcess();
    const fakeAuth = makeFakeProcess();
    spawnMock
      .mockReturnValueOnce(fakeVersion.proc)
      .mockReturnValueOnce(fakeAuth.proc);
    const promise = ensureGh();
    fakeVersion.emitStdout("gh version 2.65.0");
    fakeVersion.finish(0);
    fakeAuth.emitStderr("Logged in to github.com");
    fakeAuth.finish(0);
    await expect(promise).resolves.toBeUndefined();
  });

  it("throws GhError(not_installed) when 'gh --version' exits non-zero", async () => {
    const fakeVersion = makeFakeProcess();
    spawnMock.mockReturnValueOnce(fakeVersion.proc);
    const promise = ensureGh();
    fakeVersion.emitStderr("command not found");
    fakeVersion.finish(127);
    await expect(promise).rejects.toBeInstanceOf(GhError);
    await expect(promise).rejects.toMatchObject({ kind: "not_installed" });
  });

  it("throws GhError(not_authenticated) with renew hint when 'gh auth status' reports not logged in", async () => {
    const fakeVersion = makeFakeProcess();
    const fakeAuth = makeFakeProcess();
    spawnMock
      .mockReturnValueOnce(fakeVersion.proc)
      .mockReturnValueOnce(fakeAuth.proc);
    const promise = ensureGh();
    fakeVersion.emitStdout("gh version 2.65.0");
    fakeVersion.finish(0);
    fakeAuth.emitStderr("You are not logged into any GitHub hosts");
    fakeAuth.finish(1);
    await expect(promise).rejects.toBeInstanceOf(GhError);
    await expect(promise).rejects.toMatchObject({
      kind: "not_authenticated",
      hint: expect.stringContaining("renew-gh-token.sh"),
    });
  });
});

describe("parseGhError", () => {
  it("classifies 'command not found' / 'no such file' as not_installed", () => {
    expect(parseGhError("bash: gh: command not found")).toEqual({
      kind: "not_installed",
      hint: expect.stringContaining("cli.github.com"),
    });
    expect(parseGhError("no such file or directory: gh")).toEqual({
      kind: "not_installed",
      hint: expect.stringContaining("cli.github.com"),
    });
  });

  it("classifies 'not logged in' / 'authentication failed' / 401 as not_authenticated", () => {
    expect(parseGhError("You are not logged into any GitHub hosts")).toEqual({
      kind: "not_authenticated",
      hint: expect.stringContaining("renew-gh-token.sh"),
    });
    expect(parseGhError("authentication failed")).toEqual({
      kind: "not_authenticated",
      hint: expect.stringContaining("renew-gh-token.sh"),
    });
    expect(parseGhError("HTTP 401 Unauthorized")).toEqual({
      kind: "not_authenticated",
      hint: expect.stringContaining("renew-gh-token.sh"),
    });
  });

  it("classifies 'rate limit' / 403 as rate_limited", () => {
    expect(parseGhError("API rate limit exceeded")).toEqual({
      kind: "rate_limited",
      hint: expect.stringContaining("personal-access-tokens"),
    });
    expect(parseGhError("HTTP 403 Forbidden")).toEqual({
      kind: "rate_limited",
      hint: expect.stringContaining("personal-access-tokens"),
    });
  });

  it("classifies 404 / 'not found' as not_found", () => {
    expect(parseGhError("HTTP 404 Not Found")).toEqual({
      kind: "not_found",
      hint: expect.stringContaining("issue/PR number"),
    });
  });

  it("returns unknown with the first stderr line as a fallback", () => {
    expect(parseGhError("some weird output\nmore lines").kind).toBe("unknown");
    expect(parseGhError("").hint).toBe("unknown error");
  });
});
