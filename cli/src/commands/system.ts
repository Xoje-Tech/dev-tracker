import { Command } from "commander";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CURRENT_VERSION = "1.2.1";
const REPO_OWNER = "Xoje-Tech";
const REPO_NAME = "dev-tracker";

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
        console.error(`\x1b[31mError: Production deploy script not found at ${deployScript}\x1b[0m`);
        console.error("Please make sure dev-tracker-server is installed at ~/dev-tracker-server");
        process.exit(1);
      }

      console.log(`\x1b[33m=== [dt] Executing deployment pipeline: ${deployScript} ===\x1b[0m\n`);

      const child = spawn("bash", [deployScript], { stdio: "inherit" });

      child.on("close", (code) => {
        if (code === 0) {
          console.log("\n\x1b[32m=== [dt] Server updated and verified successfully! ===\x1b[0m");
        } else {
          console.error(`\n\x1b[31m=== [dt] Error: Deployment failed with exit code ${code} ===\x1b[0m`);
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
      console.log(`Current version: v${CURRENT_VERSION}`);
      console.log("Checking for updates in GitHub Releases...");

      try {
        const response = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "dev-tracker-cli-updater",
            },
          }
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
        console.log(`Latest published version: ${latestTag}`);

        if (!isNewer(CURRENT_VERSION, latestTag)) {
          console.log("\n\x1b[32mYou are already on the latest version of the dt CLI! ✨\x1b[0m");
          return;
        }

        console.log(`\n\x1b[33mA new update is available: ${latestTag}! 🚀\x1b[0m`);

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
          console.error(
            `\n\x1b[31mError: Automatic CLI updates are not supported on your platform/arch: ${platform}/${arch}\x1b[0m`
          );
          console.log("Please build from source under the /cli directory.");
          return;
        }

        const asset = release.assets.find((a) => a.name === targetAsset);
        if (!asset) {
          console.error(
            `\n\x1b[31mError: Could not find pre-compiled binary for your system (${targetAsset}) in the latest release.\x1b[0m`
          );
          return;
        }

        // Determine destination path
        // Standard user bin path where 'dt' is normally symlinked or placed
        const binDest = join(homedir(), ".local", "bin", "dt");

        // Safety check: is this a dev environment where the binary is not the running context?
        if (process.env.npm_lifecycle_event || process.env.TSX_VERSION || process.env.VITEST) {
          console.log(`\n[Dev Mode] Detected running inside workspace or tests.`);
          console.log(`Would download: ${asset.browser_download_url}`);
          console.log(`Target destination: ${binDest}`);
          console.log("\x1b[32mSkipping real download/overwrite to prevent dev-environment contamination.\x1b[0m");
          return;
        }

        console.log(`Downloading ${targetAsset} ...`);
        const downloadRes = await fetch(asset.browser_download_url);
        if (!downloadRes.ok) {
          throw new Error(`Failed to download binary (HTTP ${downloadRes.status})`);
        }

        const buffer = await downloadRes.arrayBuffer();

        console.log(`Writing binary to ${binDest} ...`);
        writeFileSync(binDest, Buffer.from(buffer));
        chmodSync(binDest, "755");

        console.log(`\n\x1b[32m=== Success! dt CLI has been updated to ${latestTag} ===\x1b[0m`);
      } catch (err) {
        console.error(
          `\n\x1b[31mError: Update failed: ${err instanceof Error ? err.message : String(err)}\x1b[0m`
        );
      }
    });
}
