import { describe, it, expect, vi } from "vitest";
import { Command } from "commander";
import { mockFetch } from "../../test-helpers.js";
import { registerSystemCommands } from "./system.js";

// Mocked fs so the "missing script" tests never touch the real
// ~/dev-tracker-server/scripts/deploy.sh. The vi.hoisted handle is
// available to top-level test bodies (vi.mock runs in a separate
// module-init context).
const { mockedExistsSync } = vi.hoisted(() => {
  const fn = vi.fn() as ReturnType<typeof vi.fn>;
  return { mockedExistsSync: fn };
});
vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: mockedExistsSync,
    writeFileSync: vi.fn(),
    chmodSync: vi.fn(),
  };
});

/**
 * Tests for `dt server update` and `dt update` (self-update).
 *
 * The implementation calls globalThis.fetch against api.github.com. We
 * never hit the network in tests — mockFetch replays a queue of canned
 * responses. Tests are scoped to the version-comparison + asset-lookup
 * logic; the actual `writeFileSync` is short-circuited by the
 * "running inside tests" guard in the implementation (VITEST env var).
 */

function makeProgram(): Command {
  const program = new Command();
  registerSystemCommands(program);
  return program;
}

function setTty(value: boolean): void {
  // process.stdout.isTTY is read-only in some Node versions; use defineProperty
  // to override for the test. Restored to undefined in afterEach-style cleanup.
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreTty(): void {
  Object.defineProperty(process.stdout, "isTTY", {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

describe("dt server update (alias: deploy)", () => {
  it("registers the command and its alias", () => {
    const program = makeProgram();
    const server = program.commands.find((c) => c.name() === "server");
    expect(server).toBeDefined();
    const updateCmd = server!.commands.find((c) => c.name() === "update");
    expect(updateCmd).toBeDefined();
    expect(updateCmd!.aliases()).toContain("deploy");
  });

  it("emits a structured JSON error when in machine mode and the deploy script is missing", async () => {
    // CRITICAL: never let the test reach the real ~/dev-tracker-server/scripts/deploy.sh.
    mockedExistsSync.mockReturnValue(false);
    setTty(false); // force machine mode
    delete process.env.DT_FORCE_HUMAN;

    const program = makeProgram();
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await program.parseAsync(["node", "dt", "server", "update"]);

    const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(allStdout).toMatch(/"error":\s*"Production deploy script not found/);
    expect(allStdout).toMatch(/"code":\s*1/);
    expect(stderrSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
    mockedExistsSync.mockReset();
    restoreTty();
  });

  it("emits a coloured human error when in TTY mode and the deploy script is missing", async () => {
    mockedExistsSync.mockReturnValue(false);
    setTty(true); // force human mode
    process.env.DT_FORCE_HUMAN = "1"; // belt-and-braces in case the test env is weird

    const program = makeProgram();
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await program.parseAsync(["node", "dt", "server", "update"]);

    // In human mode, JSON does NOT go to stdout
    const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(allStdout).not.toMatch(/"error":/);
    // The error is on stderr, colour-coded
    const allStderr = stderrSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allStderr).toMatch(/Production deploy script not found/);

    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
    delete process.env.DT_FORCE_HUMAN;
    mockedExistsSync.mockReset();
    restoreTty();
  });
});

describe("dt update (alias: self-update)", () => {
  it("registers the command and its alias", () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === "update");
    expect(cmd).toBeDefined();
    expect(cmd!.aliases()).toContain("self-update");
  });

  it("emits JSON success when already on latest (machine mode)", async () => {
    mockedExistsSync.mockReturnValue(false);
    setTty(false);
    delete process.env.DT_FORCE_HUMAN;

    const { enqueue } = mockFetch();
    enqueue([
      {
        status: 200,
        body: { tag_name: "v1.2.1", name: "v1.2.1", assets: [] },
      },
    ]);

    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const program = makeProgram();
    await program.parseAsync(["node", "dt", "update"]);

    const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(allStdout).toMatch(/"info":\s*"Current version: v1\.2\.1"/);
    expect(allStdout).toMatch(/"info":\s*"Latest published version: v1\.2\.1"/);
    expect(allStdout).toMatch(/"ok":\s*true/);
    expect(allStdout).toMatch(/already on the latest version/);

    stdoutSpy.mockRestore();
    mockedExistsSync.mockReset();
    restoreTty();
  });

  it("skips real download in dev/test mode but still reports the new version (JSON)", async () => {
    mockedExistsSync.mockReturnValue(false);
    setTty(false);
    delete process.env.DT_FORCE_HUMAN;
    process.env.VITEST = "1";
    delete process.env.TSX_VERSION;
    delete process.env.npm_lifecycle_event;

    const { enqueue } = mockFetch();
    enqueue([
      {
        status: 200,
        body: {
          tag_name: "v1.3.0",
          name: "v1.3.0",
          assets: [{ name: "dt-linux-x64", browser_download_url: "https://example.invalid/dt" }],
        },
      },
    ]);

    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const program = makeProgram();
    await program.parseAsync(["node", "dt", "update"]);

    const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(allStdout).toMatch(/"info":\s*"A new update is available: v1\.3\.0/);
    expect(allStdout).toMatch(/"devMode":\s*true/);
    expect(allStdout).toMatch(/Skipping real download/);

    stdoutSpy.mockRestore();
    mockedExistsSync.mockReset();
    restoreTty();
  });

  it("emits a JSON error when the latest release is missing the platform asset", async () => {
    mockedExistsSync.mockReturnValue(false);
    setTty(false);
    delete process.env.DT_FORCE_HUMAN;

    const { enqueue } = mockFetch();
    enqueue([
      {
        status: 200,
        body: {
          tag_name: "v1.3.0",
          name: "v1.3.0",
          assets: [{ name: "dt-macos-arm64", browser_download_url: "https://example.invalid/mac" }],
        },
      },
    ]);

    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const program = makeProgram();
    await program.parseAsync(["node", "dt", "update"]);

    const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(allStdout).toMatch(/"error":\s*"Could not find pre-compiled binary/);
    expect(allStdout).toMatch(/"code":\s*3/);

    stdoutSpy.mockRestore();
    mockedExistsSync.mockReset();
    restoreTty();
  });
});