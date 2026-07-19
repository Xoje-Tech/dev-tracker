import { Command } from "commander";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isMachineMode } from "../output.js";
import { getCliVersion } from "../version.js";

const REPO_OWNER = "Xoje-Tech";
const REPO_NAME = "dev-tracker";
const GHCR_IMAGE = `ghcr.io/${REPO_OWNER.toLowerCase()}/dev-tracker-server`;

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
export function parseVersion(vStr: string): { major: number; minor: number; patch: number } {
  const match = vStr.match(/v?(\d+\.\d+\.\d+)/);
  const cleaned = match ? match[1] : "0.0.0";
  const parts = cleaned.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

export function isNewer(current: string, latest: string): boolean {
  const curr = parseVersion(current);
  const lat = parseVersion(latest);
  if (lat.major > curr.major) return true;
  if (lat.major === curr.major && lat.minor > curr.minor) return true;
  if (lat.major === curr.major && lat.minor === curr.minor && lat.patch > curr.patch) return true;
  return false;
}

/**
 * Query the GHCR registry for the `latest` tag of the server image and
 * return the digest (SHA256) so we can determine the version behind it.
 *
 * GHCR exposes OCI image manifests via a public anonymous API. We use
 * the token endpoint + manifest list endpoint to get the actual digest.
 */
async function fetchLatestServerDigest(): Promise<string | null> {
  try {
    const tokenRes = await fetch(
      `https://ghcr.io/token?service=ghcr.io&scope=repository:${REPO_OWNER.toLowerCase()}/${REPO_NAME}/dev-tracker-server:pull`,
    );
    if (!tokenRes.ok) return null;
    const tokenJson = (await tokenRes.json()) as { token?: string };
    if (!tokenJson.token) return null;

    const manifestRes = await fetch(
      `https://ghcr.io/v2/${REPO_OWNER.toLowerCase()}/${REPO_NAME}/dev-tracker-server/manifests/latest`,
      {
        headers: {
          Accept: "application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.manifest.v1+json",
          Authorization: `Bearer ${tokenJson.token}`,
        },
      },
    );
    if (!manifestRes.ok) return null;
    // OCI digest header is the canonical image identifier.
    return manifestRes.headers.get("docker-content-digest");
  } catch {
    return null;
  }
}

/**
 * Compare the running container's digest to the GHCR :latest digest.
 * Used by `dt server status` to detect drift between running and
 * available updates.
 */
async function isContainerOutdated(containerName: string): Promise<{
  outdated: boolean;
  runningDigest: string | null;
  latestDigest: string | null;
}> {
  try {
    const { execSync } = await import("node:child_process");
    const inspect = execSync(
      `podman inspect --format '{{.ImageDigest}}' ${containerName}`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    const runningDigest = inspect || null;
    const latestDigest = await fetchLatestServerDigest();
    return {
      outdated: Boolean(runningDigest && latestDigest && runningDigest !== latestDigest),
      runningDigest,
      latestDigest,
    };
  } catch {
    return { outdated: false, runningDigest: null, latestDigest: null };
  }
}

export function registerSystemCommands(program: Command): void {
  // 0. Top-level `dt version` — show the running CLI version. Reads from
  //    cli/package.json via getCliVersion(); falls back to "unknown".
  program
    .command("version")
    .description("Print the dt CLI version and exit")
    .action(() => {
      const version = getCliVersion();
      if (isMachineMode(program)) {
        process.stdout.write(JSON.stringify({ version }) + "\n");
      } else {
        console.log(`dt v${version}`);
      }
    });

  // 1. Server management subcommand.
  const server = program
    .command("server")
    .description("Manage the dev-tracker production server");

  // 1a. dt server status — show current vs available.
  server
    .command("status")
    .description("Show the local server's status vs the latest GHCR image")
    .action(async () => {
      const currentVersion = getCliVersion();
      emitInfo(program, `dt CLI version: v${currentVersion}`);
      emitInfo(program, `Checking ${GHCR_IMAGE}:latest ...`);
      const status = await isContainerOutdated(
        "dev-tracker-server_dev-tracker-server_1",
      );
      if (status.latestDigest === null) {
        emitError(
          program,
          "Could not fetch latest image digest from GHCR (offline or rate-limited). Try `podman pull` manually.",
          1,
          { status: "unknown" },
        );
        process.exit(1);
        return;
      }
      if (status.outdated) {
        emitInfo(
          program,
          `Update available! Running ${status.runningDigest?.slice(0, 12)}... → latest ${status.latestDigest.slice(0, 12)}...`,
        );
        emitInfo(program, `Run 'dt server update' to apply.`);
      } else {
        emitSuccess(program, `Server is up to date with :latest.`);
      }
    });

  // 1b. dt server update — pulls latest image, restarts container, verifies health.
  server
    .command("update")
    .alias("deploy")
    .description("Update the local Podman server to the latest GHCR image")
    .option("--yes", "skip confirmation prompt (for CI)")
    .action(async (opts: { yes?: boolean }) => {
      const currentVersion = getCliVersion();

      // Confirm with the user before running the deploy script. Skip
      // when --yes or when in JSON mode (CI/agent invocation).
      if (!opts.yes && !isMachineMode(program)) {
        emitInfo(
          program,
          `About to update the local dev-tracker server to the latest GHCR image (ghcr.io/...:latest).`,
        );
        emitInfo(program, `Current dt CLI version: v${currentVersion}`);
        emitInfo(program, `This will restart the running container.`);
        emitInfo(
          program,
          `Continue? [y/N] (use --yes to skip this prompt)`,
        );
        const answer = (await new Promise<string>((resolve) => {
          process.stdin.once("data", (chunk) => resolve(chunk.toString().trim()));
          process.stdin.once("end", () => resolve(""));
          // Resume stdin in case it's paused (node-tty behaviour).
          if (process.stdin.isPaused()) process.stdin.resume();
        })).toLowerCase();
        if (answer !== "y" && answer !== "yes") {
          emitInfo(program, `Aborted.`);
          return;
        }
      }

      const deployScript = join(homedir(), "dev-tracker-server", "scripts", "deploy.sh");
      if (!existsSync(deployScript)) {
        emitError(program, `Production deploy script not found at ${deployScript}`, 1);
        if (!isMachineMode(program)) {
          console.error("Please make sure dev-tracker-server is installed at ~/dev-tracker-server");
        }
        // Use process.exitCode instead of process.exit so the process
        // doesn't actually exit during tests (and so async/await
        // control flow returns cleanly to the test runner).
        process.exitCode = 1;
        return;
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
          process.exitCode = code ?? 1;
        }
      });
    });

  // 2. Command to update the CLI binary itself.
  program
    .command("update")
    .alias("self-update")
    .description("Check for updates and update the dt CLI binary")
    .action(async () => {
      const machine = isMachineMode(program);
      const currentVersion = getCliVersion();
      emitInfo(program, `Current version: v${currentVersion}`);
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

        if (!isNewer(currentVersion, latestTag)) {
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