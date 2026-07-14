import { Command } from "commander";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isMachineMode } from "../output.js";

const CURRENT_VERSION = "1.2.1";
const REPO_OWNER = "Xoje-Tech";
const REPO_NAME = "dev-tracker";

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
    console.log(`\x1b[33m${message}\x1b[0m`);
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

// Helper to parse semver string (e.g. "1.2.1" or "dev-tracker-v1.3.0") into numbers
function parseVersion(vStr: string): { major: number; minor: number; patch: number } {
  const match = vStr.match(/v?(\d+\.\d+\.\d+)/);
  const cleaned = match ? match[1] : "0.0.0";
  const parts = cleaned.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

function isNewer(current: string, latest: string): boolean {
  const curr = parseVersion(current);
  const lat = parseVersion(latest);
  if (lat.major > curr.major) return true;
  if (lat.major === curr.major && lat.minor > curr.minor) return true;
  if (lat.major === curr.major && lat.minor === curr.minor && lat.patch > curr.patch) return true;
  return false;
}

export function registerSystemCommands(program: Command): void {
  // 1. Command to update the Podman server
  const server = program
    .command("server")
    .description("Manage the dev-tracker production server");

  server
    .command("update")
    .alias("deploy")
    .description("Update the local Podman server to the latest GHCR image")
    .action(async () => {
      const deployScript = join(homedir(), "dev-tracker-server", "scripts", "deploy.sh");
      if (!existsSync(deployScript)) {
        emitError(program, `Production deploy script not found at ${deployScript}`, 1);
        if (isMachineMode(program)) {
          // JSON mode consumer has the error in stdout; exit cleanly
          // without dumping the "Please make sure..." hint twice.
        } else {
          console.error("Please make sure dev-tracker-server is installed at ~/dev-tracker-server");
        }
        process.exit(1);
        return; // unreachable; makes TS happy
      }

      emitInfo(program, `=== [dt] Executing deployment pipeline: ${deployScript} ===`);

      const child = spawn("bash", [deployScript], {
        stdio: isMachineMode(program) ? ["ignore", "inherit", "inherit"] : "inherit",
      });

      child.on("close", (code) => {
        if (code === 0) {
          emitSuccess(program, "=== [dt] Server updated and verified successfully! ===");
        } else {
          emitError(program, `Deployment failed with exit code ${code}`, code ?? 1);
          process.exit(code ?? 1);
        }
      });
    });

  // 2. Command to update the CLI binary itself
  program
    .command("update")
    .alias("self-update")
    .description("Check for updates and update the dt CLI binary")
    .action(async () => {
      const machine = isMachineMode(program);
      emitInfo(program, `Current version: v${CURRENT_VERSION}`);
      if (!machine) console.log("Checking for updates in GitHub Releases...");

      try {
        const response = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "dev-tracker-cli-updater",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch latest release metadata (HTTP ${response.status})`);
        }

        const release = (await response.json()) as {
          tag_name: string;
          name: string;
          assets: { name: string; browser_download_url: string }[];
        };

        const latestTag = release.tag_name;
        emitInfo(program, `Latest published version: ${latestTag}`);

        if (!isNewer(CURRENT_VERSION, latestTag)) {
          emitSuccess(program, "You are already on the latest version of the dt CLI! ✨");
          return;
        }

        emitInfo(program, `A new update is available: ${latestTag}! 🚀`);

        // Identify the correct asset name for user's platform/arch
        const platform = process.platform; // 'darwin', 'linux'
        const arch = process.arch; // 'arm64', 'x64'

        let targetAsset = "";
        if (platform === "darwin" && arch === "arm64") {
          targetAsset = "dt-macos-arm64";
        } else if (platform === "darwin" && arch === "x64") {
          targetAsset = "dt-macos-x64";
        } else if (platform === "linux" && arch === "x64") {
          targetAsset = "dt-linux-x64";
        } else {
          emitError(
            program,
            `Automatic CLI updates are not supported on your platform/arch: ${platform}/${arch}`,
            2,
          );
          if (!machine) {
            console.log("Please build from source under the /cli directory.");
          }
          return;
        }

        const asset = release.assets.find((a) => a.name === targetAsset);
        if (!asset) {
          emitError(
            program,
            `Could not find pre-compiled binary for your system (${targetAsset}) in the latest release.`,
            3,
          );
          return;
        }

        // Determine destination path
        const binDest = join(homedir(), ".local", "bin", "dt");

        // Safety check: is this a dev environment where the binary is not the running context?
        if (process.env.npm_lifecycle_event || process.env.TSX_VERSION || process.env.VITEST) {
          emitInfo(
            program,
            `[Dev Mode] Detected running inside workspace or tests. Would download: ${asset.browser_download_url}; target: ${binDest}. Skipping real download/overwrite.`,
            { devMode: true, downloadUrl: asset.browser_download_url, target: binDest },
          );
          return;
        }

        emitInfo(program, `Downloading ${targetAsset} ...`);
        const downloadRes = await fetch(asset.browser_download_url);
        if (!downloadRes.ok) {
          throw new Error(`Failed to download binary (HTTP ${downloadRes.status})`);
        }

        const buffer = await downloadRes.arrayBuffer();

        emitInfo(program, `Writing binary to ${binDest} ...`);
        writeFileSync(binDest, Buffer.from(buffer));
        chmodSync(binDest, "755");

        emitSuccess(program, `dt CLI has been updated to ${latestTag}`, { version: latestTag });
      } catch (err) {
        emitError(
          program,
          `Update failed: ${err instanceof Error ? err.message : String(err)}`,
          4,
        );
      }
    });
}