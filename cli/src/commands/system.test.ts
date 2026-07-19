import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { mockFetch } from "../../test-helpers.js";
import { registerSystemCommands } from "./system.js";
import { getCliVersion, resetCliVersionCache } from "../version.js";

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
    // Mock existsSync ONLY for the deploy script path. Other paths
    // (e.g. package.json resolution for getCliVersion) use the real
    // existsSync. This is important because version.ts depends on
    // existsSync to find the CLI's package.json, and the test would
    // otherwise break the helper.
    existsSync: vi.fn((p: string) => {
      if (typeof p === "string" && p.includes("dev-tracker-server/scripts/deploy.sh")) {
        return mockedExistsSync();
      }
      return actual.existsSync(p);
    }),
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
  // commander and our isMachineMode() helper both read isTTY() on
  // process.stdout. Mock it directly so the JSON-vs-human output path
  // matches the test's intent (true = human, false = machine).
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

describe("system commands", () => {
  beforeEach(() => {
    mockedExistsSync.mockReturnValue(false);
    vi.restoreAllMocks();
    // Important: reset the module-level CLI version cache between tests
    // so each test reads its own DT_CLI_VERSION or sees a fresh
    // package.json lookup.
    resetCliVersionCache();
    delete process.env.DT_CLI_VERSION;
    delete process.env.DT_FORCE_HUMAN;
    // Reset isTTY to undefined (real state). Tests that need a
    // specific mode call setTty() explicitly.
    Object.defineProperty(process.stdout, "isTTY", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    restoreTty();
    resetCliVersionCache();
  });

  describe("dt version", () => {
    it("prints the CLI version in human mode", async () => {
      setTty(false);
      resetCliVersionCache();
      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "version"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(out).toMatch(/"version":\s*"\d+\.\d+\.\d+"/);
      stdoutSpy.mockRestore();
    });

    it("emits JSON in machine mode with the package.json version", async () => {
      setTty(false);
      resetCliVersionCache();
      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "version"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(out).toMatch(/"version":\s*"\d+\.\d+\.\d+"/);
      stdoutSpy.mockRestore();
    });

    it("honours DT_CLI_VERSION override", async () => {
      process.env.DT_CLI_VERSION = "9.9.9-test";
      resetCliVersionCache();
      setTty(false);
      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "version"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(out).toContain("9.9.9-test");
      stdoutSpy.mockRestore();
      delete process.env.DT_CLI_VERSION;
      resetCliVersionCache();
    });
  });

  describe("dt update (self-update)", () => {
    it("emits a JSON success line when the CLI is already up to date", async () => {
      setTty(false);
      const currentVersion = getCliVersion();

      const { enqueue } = mockFetch();
      enqueue([
        {
          status: 200,
          body: { tag_name: `v${currentVersion}`, name: `v${currentVersion}`, assets: [] },
        },
      ]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update"]);

      const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(allStdout).toMatch(new RegExp(`"info":\\s*"Current version: v${currentVersion.replace(/\./g, "\\.")}"`));
      expect(allStdout).toMatch(new RegExp(`"info":\\s*"Latest published version: v${currentVersion.replace(/\./g, "\\.")}"`));
      expect(allStdout).toMatch(/"ok":\s*true/);
      expect(allStdout).toMatch(/already on the latest version/);

      stdoutSpy.mockRestore();
      mockedExistsSync.mockReset();
    });

    it("skips real download in dev/test mode but still reports the new version (JSON)", async () => {
      setTty(false);
      process.env.VITEST = "1";
      delete process.env.TSX_VERSION;
      delete process.env.npm_lifecycle_event;

      const { enqueue } = mockFetch();
      enqueue([
        {
          status: 200,
          body: {
            tag_name: "v99.0.0",
            name: "v99.0.0",
            assets: [
              { name: "dt-linux-x64", browser_download_url: "https://example.invalid/dt" },
            ],
          },
        },
      ]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update"]);

      const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(allStdout).toMatch(/"info":\s*"A new update is available: v99\.0\.0/);
      expect(allStdout).toMatch(/"devMode":\s*true/);
      expect(allStdout).toMatch(/Skipping real download/);

      stdoutSpy.mockRestore();
      mockedExistsSync.mockReset();
    });

    it("emits a JSON error when the latest release is missing the platform asset", async () => {
      setTty(false);

      const { enqueue } = mockFetch();
      enqueue([
        {
          status: 200,
          body: {
            tag_name: "v99.0.0",
            name: "v99.0.0",
            assets: [
              { name: "dt-macos-arm64", browser_download_url: "https://example.invalid/mac" },
            ],
          },
        },
      ]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update"]);

      const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(allStdout).toMatch(/"error":\s*"Could not find pre-compiled binary/);
      expect(allStdout).toMatch(/"code":\s*3/);

      stdoutSpy.mockRestore();
      mockedExistsSync.mockReset();
    });
  });

  describe("dt server update", () => {
      it("emits a JSON error when the deploy script is missing", async () => {
        setTty(false);
        // Reset the exit code from any prior test in this run.
        process.exitCode = 0;
        const stdoutSpy = vi
          .spyOn(process.stdout, "write")
          .mockImplementation(() => true);
        const stderrSpy = vi
          .spyOn(process.stderr, "write")
          .mockImplementation(() => true);

        const program = makeProgram();
        await program.parseAsync(["node", "dt", "server", "update", "--yes"]);
        // The command sets process.exitCode = 1 when the script is
        // missing (we use exitCode instead of exit so tests don't actually
        // terminate the test runner).
        expect(process.exitCode).toBe(1);

        const allStdout = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
        const allStderr = stderrSpy.mock.calls.map((c) => String(c[0])).join("");
        // JSON error goes to stdout in machine mode (stderr is for
        // human mode).
        const all = allStdout + allStderr;
        expect(all).toMatch(/Production deploy script not found/);

        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
        process.exitCode = 0;
      });
    });
  });