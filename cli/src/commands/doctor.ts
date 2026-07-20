import { Command } from "commander";
import { existsSync, statSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { isMachineMode } from "../output.js";
import { getCliVersion } from "../version.js";
import { isNewer } from "./system.js";

/** A single doctor check result. */
export type CheckResult = {
  name: string;
  ok: boolean;
  status: "pass" | "fail" | "warn" | "skip";
  value?: string;
  message?: string;
  durationMs?: number;
};

/** Run a check and capture timing + error info. */
async function runCheck(
  name: string,
  fn: () => Promise<{ ok: boolean; value?: string; message?: string }>,
  timeoutMs = 5000,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs),
      ),
    ]);
    return {
      name,
      ok: result.ok,
      status: result.ok ? "pass" : "fail",
      value: result.value,
      message: result.message,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      ok: false,
      status: err instanceof Error && err.message === "timeout" ? "skip" : "fail",
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

/* === Individual checks === */

/** C1: CLI version can be resolved. */
async function checkCliVersion(): Promise<{ ok: boolean; value?: string }> {
  const version = getCliVersion();
  return {
    ok: version !== "unknown" && /^\d+\.\d+\.\d+/.test(version),
    value: version,
  };
}

/** C2: CLI is up to date with the latest GitHub release. */
async function checkCliUpToDate(): Promise<{ ok: boolean; value?: string }> {
  const current = getCliVersion();
  try {
    const response = await fetch(
      "https://api.github.com/repos/Xoje-Tech/dev-tracker/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "dev-tracker-cli-doctor",
        },
      },
    );
    if (!response.ok) return { ok: false, value: `http-${response.status}` };
    const release = (await response.json()) as { tag_name: string };
    const latest = release.tag_name.replace(/^v/, "").replace(/^dev-tracker-v/, "");
    if (current === "unknown") return { ok: false, value: "current-unknown" };
    return {
      ok: !isNewer(current, latest),
      value: `${current} (latest: ${latest})`,
    };
  } catch (err) {
    return {
      ok: false,
      value: `network-error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** C3: Server container is running. */
async function checkServerRunning(): Promise<{ ok: boolean; value?: string }> {
  try {
    const out = execSync(
      "podman ps --filter name=dev-tracker-server_dev-tracker-server_1 --format '{{.Names}}'",
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return {
      ok: out.length > 0,
      value: out || "not-found",
    };
  } catch {
    return { ok: false, value: "podman-unavailable" };
  }
}

/** C4: Server is up to date with GHCR :latest. */
async function checkServerUpToDate(): Promise<{ ok: boolean; value?: string }> {
  try {
    // Get the running container's image digest.
    const localDigest = execSync(
      "podman inspect --format '{{.ImageDigest}}' dev-tracker-server_dev-tracker-server_1",
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (!localDigest) return { ok: false, value: "no-local-digest" };

    // Query GHCR for the :latest digest.
    const tokenRes = await fetch(
      "https://ghcr.io/token?service=ghcr.io&scope=repository:xoje-tech/dev-tracker/dev-tracker-server:pull",
    );
    if (!tokenRes.ok) return { ok: false, value: `ghcr-token-${tokenRes.status}` };
    const { token } = (await tokenRes.json()) as { token: string };

    const manifestRes = await fetch(
      "https://ghcr.io/v2/xoje-tech/dev-tracker/dev-tracker-server/manifests/latest",
      {
        headers: {
          Accept:
            "application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.manifest.v1+json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!manifestRes.ok) return { ok: false, value: `ghcr-manifest-${manifestRes.status}` };
    const remoteDigest = manifestRes.headers.get("docker-content-digest");
    if (!remoteDigest) return { ok: false, value: "no-remote-digest" };

    return {
      ok: localDigest === remoteDigest,
      value: `local=${localDigest.slice(7, 19)} remote=${remoteDigest.slice(7, 19)}`,
    };
  } catch (err) {
    return {
      ok: false,
      value: `error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** C5: API is reachable. */
async function checkApiReachable(): Promise<{ ok: boolean; value?: string }> {
  try {
    const response = await fetch("http://127.0.0.1:6789/api/health", {
      signal: AbortSignal.timeout(3000),
    });
    return {
      ok: response.ok,
      value: `http-${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      value: err instanceof Error ? err.message : String(err),
    };
  }
}

/** C6: Auth works (try /auth/me with the current credentials). */
async function checkAuth(): Promise<{ ok: boolean; value?: string }> {
  // This check is best-effort. We don't have direct access to the
  // user's auth state, so we just verify that /auth/me responds with
  // either 200 (authenticated) or 401 (needs login) — both indicate
  // the endpoint is reachable. If we had the API key in env, we could
  // do a full round-trip; for now, just verify the endpoint.
  try {
    const response = await fetch("http://127.0.0.1:6789/api/auth/me", {
      signal: AbortSignal.timeout(3000),
    });
    return {
      ok: response.status === 200 || response.status === 401,
      value: `http-${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      value: err instanceof Error ? err.message : String(err),
    };
  }
}

/** C7: Deploy script is present at the expected location. */
async function checkDeployScript(): Promise<{ ok: boolean; value?: string }> {
  const path = join(homedir(), "dev-tracker-server", "scripts", "deploy.sh");
  if (!existsSync(path)) {
    return { ok: false, value: `${path} (missing)` };
  }
  const stat = statSync(path);
  return {
    ok: stat.isFile() && (stat.mode & 0o111) !== 0,
    value: `${path} (${stat.mode.toString(8)})`,
  };
}

/** C8: GitHub CLI is available and authenticated. */
async function checkGitHubCli(): Promise<{ ok: boolean; value?: string }> {
  try {
    const out = execSync("gh auth status 2>&1", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const loggedIn = out.includes("Logged in");
    return {
      ok: loggedIn,
      value: loggedIn ? "logged in" : "not logged in",
    };
  } catch (err) {
    return {
      ok: false,
      value: err instanceof Error ? err.message : String(err),
    };
  }
}

/** C9: Database file is present and writable. */
async function checkDatabase(): Promise<{ ok: boolean; value?: string }> {
  // The dev-tracker compose volume mounts data at $HOME/dev-tracker-server/data.
  const dbPath = join(homedir(), "dev-tracker-server", "data", "dev.db");
  if (!existsSync(dbPath)) {
    return { ok: false, value: `${dbPath} (missing)` };
  }
  const stat = statSync(dbPath);
  // Writable by current user. stat.mode bitmask — owner-write bit (0o200).
  return {
    ok: (stat.mode & 0o200) !== 0,
    value: `${dbPath} (${stat.size} bytes)`,
  };
}

/** C10: Backup directory has at least one recent backup. */
async function checkBackups(): Promise<{ ok: boolean; value?: string }> {
  const backupDir = join(homedir(), "dev-tracker-server", "backups");
  if (!existsSync(backupDir)) {
    return { ok: false, value: `${backupDir} (missing)` };
  }
  const files = readdirSync(backupDir).filter((f) => f.endsWith(".db"));
  if (files.length === 0) {
    return { ok: false, value: `${backupDir} (empty)` };
  }
  // Find the most recent backup by mtime.
  let mostRecent = 0;
  for (const f of files) {
    const st = statSync(join(backupDir, f));
    if (st.mtimeMs > mostRecent) mostRecent = st.mtimeMs;
  }
  const ageMs = Date.now() - mostRecent;
  const ageHours = Math.round(ageMs / (1000 * 60 * 60));
  return {
    // Warn if most recent backup is older than 24h.
    ok: ageMs < 24 * 60 * 60 * 1000,
    value: `${files.length} backups, most recent ${ageHours}h ago`,
  };
}

/** All checks in order. Exposed for testing. */
export const DOCTOR_CHECKS: Array<{
  name: string;
  fn: () => Promise<{ ok: boolean; value?: string; message?: string }>;
}> = [
  { name: "cli-version", fn: checkCliVersion },
  { name: "cli-up-to-date", fn: checkCliUpToDate },
  { name: "server-running", fn: checkServerRunning },
  { name: "server-up-to-date", fn: checkServerUpToDate },
  { name: "api-reachable", fn: checkApiReachable },
  { name: "auth", fn: checkAuth },
  { name: "deploy-script", fn: checkDeployScript },
  { name: "github-cli", fn: checkGitHubCli },
  { name: "database", fn: checkDatabase },
  { name: "backups", fn: checkBackups },
];

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Run a comprehensive health check and report")
    .action(async () => {
      const machine = isMachineMode(program);

      // Run all checks in parallel.
      const results = await Promise.all(
        DOCTOR_CHECKS.map((c) => runCheck(c.name, c.fn)),
      );

      // Aggregate.
      const passCount = results.filter((r) => r.status === "pass").length;
      const failCount = results.filter((r) => r.status === "fail").length;
      const skipCount = results.filter((r) => r.status === "skip").length;

      if (machine) {
        const allOk = failCount === 0 && skipCount === 0;
        process.stdout.write(
          JSON.stringify({
            ok: allOk,
            summary: `${passCount}/${results.length} passed${failCount > 0 ? `, ${failCount} failed` : ""}${skipCount > 0 ? `, ${skipCount} skipped` : ""}`,
            checks: results,
          }) + "\n",
        );
      } else {
        // Human mode: pretty-printed table.
        for (const r of results) {
          const icon =
            r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "?";
          const tag = r.status === "pass" ? "OK" : r.status === "fail" ? "FAIL" : "SKIP";
          const detail = r.value ?? r.message ?? "";
          process.stdout.write(
            `[dt] ${r.name.padEnd(20)} ${icon} ${tag.padEnd(4)} ${detail}\n`,
          );
        }
        process.stdout.write(
          `\n[dt] ${passCount}/${results.length} checks passed${failCount > 0 ? `, ${failCount} failed` : ""}${skipCount > 0 ? `, ${skipCount} skipped` : ""}.\n`,
        );
      }

      // Exit code: 0 if all pass, 1 if any failed, 2 if any skipped.
      if (failCount > 0) process.exitCode = 1;
      else if (skipCount > 0) process.exitCode = 2;
      else process.exitCode = 0;
    });
}
