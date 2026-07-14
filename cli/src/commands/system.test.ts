import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { existsSync } from "node:fs";
import { mockFetch } from "../../test-helpers.js";
import { registerSystemCommands } from "./system.js";

// Mock the fs module so the "missing script" test never touches disk.
vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
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

describe("dt server update (alias: deploy)", () => {
  it("registers the command and its alias", () => {
    const program = makeProgram();
    const server = program.commands.find((c) => c.name() === "server");
    expect(server).toBeDefined();
    const updateCmd = server!.commands.find((c) => c.name() === "update");
    expect(updateCmd).toBeDefined();
    expect(updateCmd!.aliases()).toContain("deploy");
  });

  it("errors clearly when the deploy script is missing", async () => {
    // CRITICAL: never let the test reach the real ~/dev-tracker-server/scripts/deploy.sh.
    // Mock existsSync to return false for any path so the command's
    // "script not found" branch is the one we exercise.
    vi.mocked(existsSync).mockReturnValue(false);

    const program = makeProgram();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Stub process.exit so the runner doesn't die.
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await program.parseAsync(["node", "dt", "server", "update"]);

    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("Production deploy script not found"),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errSpy.mockRestore();
    vi.mocked(existsSync).mockReset();
  });
});

describe("dt update (alias: self-update)", () => {
  it("registers the command and its alias", () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === "update");
    expect(cmd).toBeDefined();
    expect(cmd!.aliases()).toContain("self-update");
  });

  it("reports already-on-latest when release version <= current", async () => {
    process.env.VITEST = "1";
    const { enqueue } = mockFetch();
    enqueue([
      {
        status: 200,
        body: {
          tag_name: "v1.2.1", // same as CURRENT_VERSION
          name: "v1.2.1",
          assets: [],
        },
      },
    ]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(["node", "dt", "update"]);

    const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allOutput).toMatch(/Latest published version: v1\.2\.1/);
    expect(allOutput).toMatch(/already on the latest version/);

    logSpy.mockRestore();
  });

  it("skips real download in dev/test mode but still reports the new version", async () => {
    // CRITICAL: also mock existsSync so any platform-assert that
    // touches the filesystem is harmless in tests.
    vi.mocked(existsSync).mockReturnValue(false);
    process.env.VITEST = "1";
    // The implementation also short-circuits when npm_lifecycle_event
    // is set (true under pnpm test) or TSX_VERSION is set; ensure those
    // envs are clean so only VITEST drives the dev-mode detection.
    delete process.env.TSX_VERSION;
    delete process.env.npm_lifecycle_event;

    const { enqueue } = mockFetch();
    enqueue([
      {
        status: 200,
        body: {
          tag_name: "v1.3.0", // newer than CURRENT_VERSION 1.2.1
          name: "v1.3.0",
          assets: [
            { name: "dt-linux-x64", browser_download_url: "https://example.invalid/dt" },
          ],
        },
      },
    ]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(["node", "dt", "update"]);

    const allOutput = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allOutput).toMatch(/new update is available: v1\.3\.0/);
    expect(allOutput).toMatch(/Dev Mode\] Detected running inside workspace or tests/);
    expect(allOutput).toMatch(/Skipping real download/);

    logSpy.mockRestore();
    vi.mocked(existsSync).mockReset();
  });

  it("errors when the latest release is missing the platform asset", async () => {
    process.env.VITEST = "1";
    const { enqueue } = mockFetch();
    enqueue([
      {
        status: 200,
        body: {
          tag_name: "v1.3.0",
          name: "v1.3.0",
          assets: [
            // No dt-linux-x64 — test the "asset missing" path
            { name: "dt-macos-arm64", browser_download_url: "https://example.invalid/mac" },
          ],
        },
      },
    ]);

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(["node", "dt", "update"]);

    const allErr = errSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allErr).toMatch(/Could not find pre-compiled binary/);

    errSpy.mockRestore();
  });
});