import { Command } from "commander";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, chmodSync, renameSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { isMachineMode } from "../output.js";
import { getCliVersion } from "../version.js";
import { isNewer } from "./system.js";

const REPO_OWNER = "Xoje-Tech";
const REPO_NAME = "dev-tracker";

// CLI install location — where the dt binary lives on the host.
const BIN_DIR = join(homedir(), ".dev-tracker", "bin");
const BIN_PATH = join(BIN_DIR, "dt");
const BIN_BACKUP = join(BIN_DIR, "dt.bak");

// Production deploy script location — the script that updates the
// running container.
const DEPLOY_SCRIPT = join(homedir(), "dev-tracker-server", "scripts", "deploy.sh");

/** Emit a JSON error to stdout if in machine mode, else a coloured line to stderr. */
function emitError(program: Command, message: string, code: number, extra?: Record<string, unknown>): void {
  if (isMachineMode(program)) {
    process.stdout.write(
      JSON.stringify({ error: message, code, ...(extra ?? {}) }) + "\n",
    );
  } else {
    console.error(`\x1b[31mError: ${message}\x1b[0m`);
  }
}

/** Emit a JSON info line to stdout if in machine mode, else a coloured line to stdout. */
function emitInfo(program: Command, message: string, extra?: Record<string, unknown>): void {
  if (isMachineMode(program)) {
    process.stdout.write(JSON.stringify({ info: message, ...(extra ?? {}) }) + "\n");
  } else {
    console.log(`\x1b[33m}${message}\x1b[0m`.replace("}", "["));
  }
}

/** Emit a JSON success line to stdout if in machine mode, else coloured human format. */
function emitSuccess(program: Command, message: string, extra?: Record<string, unknown>): void {
  if (isMachineMode(program)) {
    process.stdout.write(JSON.stringify({ ok: true, message, ...(extra ?? {}) }) + "\n");
  } else {
    console.log(`\x1b[32m${message}\x1b[0m`);
  }
}

/** Map process.platform + process.arch to the asset name. */
function pickAsset(): string | null {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "linux" && arch === "x64") return "dt-linux-x64";
  if (platform === "darwin" && arch === "x64") return "dt-macos-x64";
  if (platform === "darwin" && arch === "arm64") return "dt-macos-arm64";
  return null;
}

export interface UpdateAllResult {
  ok: boolean;
  oldVersion: string;
  newVersion: string;
  serverUpdate: "success" | "failed" | "skipped";
  binarySwap: "success" | "failed" | "skipped";
  reason?: string;
  downloadPath?: string;
}

/**
 * Run the full update flow:
 *   1. Pre-flight: query GitHub for the latest release.
 *   2. Download: pull the binary for the current platform to /tmp.
 *   3. Server update: spawn the existing deploy.sh script.
 *   4. Binary swap: mv the old binary to .bak, mv the new into place.
 *
 * Returns an UpdateAllResult. On partial failure, the result reflects
 * what actually completed (e.g. serverUpdate: "failed" but binarySwap: "skipped").
 */
export async function runUpdateAll(
  program: Command,
  options: { yes?: boolean } = {},
): Promise<UpdateAllResult> {
  const oldVersion = getCliVersion();

  // === 1. Pre-flight ===
  emitInfo(program, `Current CLI version: ${oldVersion}`);
  emitInfo(program, `Checking GitHub Releases for the latest version...`);

  let release: { tag_name: string; assets: { name: string; browser_download_url: string }[] };
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "dev-tracker-cli-update-all",
        },
      },
    );
    if (!response.ok) {
      emitError(program, `Failed to fetch latest release metadata (HTTP ${response.status})`, 1);
      return { ok: false, oldVersion, newVersion: "", serverUpdate: "skipped", binarySwap: "skipped", reason: "github-api-failed" };
    }
    release = (await response.json()) as typeof release;
  } catch (err) {
    emitError(program, `Network error fetching release: ${err instanceof Error ? err.message : String(err)}`, 2);
    return { ok: false, oldVersion, newVersion: "", serverUpdate: "skipped", binarySwap: "skipped", reason: "network-error" };
  }

  const newTag = release.tag_name;
  const newVersion = newTag.replace(/^v/, "").replace(/^dev-tracker-v/, "");
  emitInfo(program, `Latest published version: ${newVersion}`);

  if (oldVersion !== "unknown" && !isNewer(oldVersion, newVersion)) {
    emitSuccess(program, `You are already on the latest version (${oldVersion}).`);
    return {
      ok: true,
      oldVersion,
      newVersion,
      serverUpdate: "skipped",
      binarySwap: "skipped",
      reason: "already-up-to-date",
    };
  }

  // === 2. Pick asset and download ===
  const assetName = pickAsset();
  if (!assetName) {
    emitError(program, `Automatic updates are not supported on your platform/arch: ${process.platform}/${process.arch}`, 3);
    return { ok: false, oldVersion, newVersion, serverUpdate: "skipped", binarySwap: "skipped", reason: "unsupported-platform" };
  }

  const asset = release.assets.find((a) => a.name === assetName);
  if (!asset) {
    emitError(program, `Could not find ${assetName} in the latest release.`, 4);
    return { ok: false, oldVersion, newVersion, serverUpdate: "skipped", binarySwap: "skipped", reason: "asset-not-found" };
  }

  // === Confirm with the user ===
  if (!options.yes && !isMachineMode(program)) {
    emitInfo(program, ``);
    emitInfo(program, `This command will update BOTH:`);
    emitInfo(program, `  1. The dt CLI binary at ${BIN_PATH}`);
    emitInfo(program, `  2. The production server container (via deploy.sh)`);
    emitInfo(program, ``);
    emitInfo(program, `Continue? [y/N] (use --yes to skip this prompt)`);
    const answer = (await new Promise<string>((resolve) => {
      process.stdin.once("data", (chunk) => resolve(chunk.toString().trim()));
      process.stdin.once("end", () => resolve(""));
      if (process.stdin.isPaused()) process.stdin.resume();
    })).toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      emitInfo(program, `Aborted.`);
      return {
        ok: false,
        oldVersion,
        newVersion,
        serverUpdate: "skipped",
        binarySwap: "skipped",
        reason: "user-aborted",
      };
    }
  }

  // === 3. Download ===
  emitInfo(program, `Downloading ${assetName} ...`);
  let buffer: Buffer;
  try {
    const res = await fetch(asset.browser_download_url);
    if (!res.ok) {
      emitError(program, `Failed to download binary (HTTP ${res.status})`, 5);
      return { ok: false, oldVersion, newVersion, serverUpdate: "skipped", binarySwap: "skipped", reason: "download-failed" };
    }
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch (err) {
    emitError(program, `Network error during download: ${err instanceof Error ? err.message : String(err)}`, 6);
    return { ok: false, oldVersion, newVersion, serverUpdate: "skipped", binarySwap: "skipped", reason: "download-failed" };
  }

  // Write the binary to /tmp/dt-{newVersion} so we can swap atomically at the end.
  const downloadPath = join(tmpdir(), `dt-${newVersion}`);
  writeFileSync(downloadPath, buffer);
  chmodSync(downloadPath, "755");
  emitInfo(program, `Binary written to ${downloadPath} (${buffer.length} bytes)`);

  // === 4. Server update (run deploy.sh) ===
  let serverUpdate: "success" | "failed" | "skipped" = "skipped";
  if (existsSync(DEPLOY_SCRIPT)) {
    emitInfo(program, `Running deployment pipeline: ${DEPLOY_SCRIPT}`);
    try {
      const code = await new Promise<number>((resolve) => {
        const child = spawn("bash", [DEPLOY_SCRIPT], {
          stdio: isMachineMode(program) ? ["ignore", "inherit", "inherit"] : "inherit",
        });
        child.on("close", (c) => resolve(c ?? 1));
      });
      if (code === 0) {
        emitSuccess(program, `Server update completed successfully.`);
        serverUpdate = "success";
      } else {
        emitError(program, `Server update failed with exit code ${code}.`, 7);
        serverUpdate = "failed";
      }
    } catch (err) {
      emitError(program, `Error running deploy.sh: ${err instanceof Error ? err.message : String(err)}`, 8);
      serverUpdate = "failed";
    }
  } else {
    emitInfo(program, `Deploy script not found at ${DEPLOY_SCRIPT} — skipping server update.`);
    serverUpdate = "skipped";
  }

  // === 5. Binary swap (only if everything else succeeded) ===
  let binarySwap: "success" | "failed" | "skipped" = "skipped";
  if (serverUpdate !== "failed") {
    try {
      if (!existsSync(BIN_DIR)) {
        // mkdir the parent if needed (rare — the binary usually exists)
        const { mkdirSync } = await import("node:fs");
        mkdirSync(BIN_DIR, { recursive: true });
      }
      // Atomic swap: old → .bak, new → BIN_PATH.
      if (existsSync(BIN_PATH)) {
        renameSync(BIN_PATH, BIN_BACKUP);
      }
      renameSync(downloadPath, BIN_PATH);
      emitSuccess(program, `Binary updated at ${BIN_PATH}.`);
      emitInfo(program, `  Previous version backed up at ${BIN_BACKUP}`);
      emitInfo(program, `  New version: ${newVersion}`);
      binarySwap = "success";
    } catch (err) {
      emitError(program, `Failed to swap binary: ${err instanceof Error ? err.message : String(err)}`, 9);
      binarySwap = "failed";
    }
  } else {
    emitInfo(program, `Skipping binary swap because server update failed.`);
    emitInfo(program, `  Re-run \`dt server update\` to retry, then \`dt update all\` to retry the swap.`);
  }

  // === Summary ===
  const overallOk = serverUpdate !== "failed" && binarySwap !== "failed";
  if (overallOk) {
    emitSuccess(program, `✅ Update complete! CLI is now ${newVersion}, server is up to date.`);
  } else {
    emitError(program, `Update finished with failures. See above.`, 10);
  }

  return {
    ok: overallOk,
    oldVersion,
    newVersion,
    serverUpdate,
    binarySwap,
    downloadPath: binarySwap === "success" ? BIN_PATH : downloadPath,
  };
}

/**
 * Register the `dt update all` command. The existing `dt update` (in
 * system.ts) handles CLI self-update only. The new `dt update all`
 * (here) extends that to also update the production server.
 *
 * Naming choice: we register at top-level as `update all` but use
 * commander's `.name("update")` with a subcommand. The trick is that
 * the existing `update` command is registered in `system.ts` with
 * `.alias("self-update")`, so we can instead make this a separate
 * top-level command named `update-all` and add a sub-suggestion.
 *
 * To avoid the name conflict with system.ts's `update` command, we
 * register under the name `update-all` (dash, not space). This still
 * reads naturally (`dt update-all` reads as "update everything").
 */
export function registerUpdateAllCommand(program: Command): void {
  program
    .command("update-all")
    .alias("updateall")
    .description(
      "Update both the dt CLI binary and the production server container in one go",
    )
    .option("--yes", "skip confirmation prompt (for CI)")
    .action(async (opts: { yes?: boolean }) => {
      const result = await runUpdateAll(program, opts);
      if (isMachineMode(program)) {
        process.stdout.write(
          JSON.stringify({
            ok: result.ok,
            oldVersion: result.oldVersion,
            newVersion: result.newVersion,
            serverUpdate: result.serverUpdate,
            binarySwap: result.binarySwap,
            reason: result.reason,
          }) + "\n",
        );
      }
      process.exitCode = result.ok ? 0 : 1;
    });
}
