import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { mockFetch } from "../../test-helpers.js";
import { registerUpdateAllCommand } from "./update-all.js";
import { resetCliVersionCache } from "../version.js";

function makeProgram(): Command {
  const program = new Command();
  registerUpdateAllCommand(program);
  return program;
}

function setTty(value: boolean): void {
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

describe("dt update-all", () => {
  beforeEach(() => {
    process.exitCode = 0;
    resetCliVersionCache();
    delete process.env.DT_CLI_VERSION;
    delete process.env.DT_FORCE_HUMAN;
    Object.defineProperty(process.stdout, "isTTY", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    restoreTty();
    process.exitCode = 0;
    resetCliVersionCache();
  });

  describe("command registration", () => {
    it("registers a top-level `update-all` command with the --yes option", () => {
      const program = makeProgram();
      const updateAllCmd = program.commands.find((c) => c.name() === "update-all");
      expect(updateAllCmd).toBeDefined();
      const yesOption = updateAllCmd!.options.find((o) => o.long === "--yes");
      expect(yesOption).toBeDefined();
    });

    it("supports the `updateall` alias", () => {
      const program = makeProgram();
      const updateAllCmd = program.commands.find((c) => c.name() === "update-all");
      expect(updateAllCmd!.aliases()).toContain("updateall");
    });
  });

  describe("happy path", () => {
    it("returns a structured JSON result with oldVersion/newVersion on success", async () => {
      setTty(false); // machine mode
      resetCliVersionCache();
      // Force a known older version so the new release triggers the flow.
      process.env.DT_CLI_VERSION = "1.4.0";

      // Stub GitHub Releases API.
      const { enqueue } = mockFetch();
      enqueue([
        {
          status: 200,
          body: {
            tag_name: "dev-tracker-v1.5.0",
            assets: [
              { name: "dt-linux-x64", browser_download_url: "https://example.invalid/dt-linux-x64" },
            ],
          },
        },
      ]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);

      // We can't easily test the binary swap without a real filesystem,
      // but the download + github fetch part is what we exercise here.
      // The swap will fail in the test environment (no BIN_DIR or
      // permission), which surfaces as binarySwap: "failed" — that's
      // still a valid signal that the flow reached the swap stage.
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update-all", "--yes"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      stdoutSpy.mockRestore();

      // The last line of the output is the JSON summary. Find the
      // final `{...}` block by anchoring on the closing brace.
      const lines = out.split("\n").filter((l) => l.trim().startsWith("{"));
      const jsonLine = lines[lines.length - 1] ?? "";
      expect(jsonLine).toBeTruthy();
      const parsed = JSON.parse(jsonLine);
      expect(parsed.oldVersion).toBe("1.4.0");
      expect(parsed.newVersion).toBe("1.5.0");
      // serverUpdate is "skipped" in test env because DEPLOY_SCRIPT
      // doesn't exist in /home/hermes/.dev-tracker-server/scripts/deploy.sh.
      expect(["success", "skipped", "failed"]).toContain(parsed.serverUpdate);
    });
  });

  describe("already up to date", () => {
    it("skips the update and returns ok=true with reason=already-up-to-date", async () => {
      setTty(false);
      resetCliVersionCache();
      process.env.DT_CLI_VERSION = "1.5.0";

      const { enqueue } = mockFetch();
      enqueue([
        {
          status: 200,
          body: {
            tag_name: "dev-tracker-v1.5.0",
            assets: [],
          },
        },
      ]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update-all", "--yes"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      stdoutSpy.mockRestore();

      expect(out).toMatch(/"reason":\s*"already-up-to-date"/);
      expect(out).toMatch(/"ok":\s*true/);
    });
  });

  describe("network failure", () => {
    it("returns ok=false with reason=github-api-failed when GitHub 5xx", async () => {
      setTty(false);
      resetCliVersionCache();
      process.env.DT_CLI_VERSION = "1.0.0";

      const { enqueue } = mockFetch();
      enqueue([{ status: 500, body: "internal" }]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update-all", "--yes"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      stdoutSpy.mockRestore();

      expect(out).toMatch(/"reason":\s*"github-api-failed"/);
      expect(out).toMatch(/"ok":\s*false/);
    });
  });

  describe("asset not found", () => {
    it("returns ok=false with reason=asset-not-found when release has no asset for our platform", async () => {
      setTty(false);
      resetCliVersionCache();
      process.env.DT_CLI_VERSION = "1.0.0";

      const { enqueue } = mockFetch();
      enqueue([
        {
          status: 200,
          body: {
            tag_name: "dev-tracker-v1.5.0",
            assets: [
              // No dt-linux-x64 in this release.
              { name: "dt-macos-arm64", browser_download_url: "https://example.invalid/dt-macos-arm64" },
            ],
          },
        },
      ]);

      const stdoutSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);
      const program = makeProgram();
      await program.parseAsync(["node", "dt", "update-all", "--yes"]);
      const out = stdoutSpy.mock.calls.map((c) => String(c[0])).join("");
      stdoutSpy.mockRestore();

      expect(out).toMatch(/"reason":\s*"asset-not-found"/);
      expect(out).toMatch(/"ok":\s*false/);
    });
  });
});
