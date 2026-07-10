import { spawn } from "node:child_process";

export interface GhResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SpawnOpts {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /**
   * Per-spawn timeout. The child is sent SIGTERM when it elapses and the
   * returned promise rejects with a GhError(unknown) carrying the duration
   * in the hint. Defaults to 30_000 ms.
   */
  timeoutMs?: number;
}

export interface GhErrorKind {
  readonly kind:
    | "not_installed"
    | "not_authenticated"
    | "rate_limited"
    | "not_found"
    | "unknown";
}

export class GhError extends Error {
  constructor(
    public readonly kind: GhErrorKind["kind"],
    public readonly hint: string,
    public readonly exitCode: number,
  ) {
    super(`gh ${kind}: ${hint}`);
    this.name = "GhError";
  }
}

const TOKEN_RENEW_HINT =
  "Renew token: bash ~/.hermes/skills/github/gh-app-token-renew/assets/renew-gh-token.sh";

/**
 * Spawn `gh` with the given args and resolve with its captured output.
 * Unlike `child_process.exec`, this Promise-based API surfaces the exit code
 * directly so callers can decide whether non-zero is an error (most are).
 */
export function runGh(args: string[], opts: SpawnOpts = {}): Promise<GhResult> {
  const { cwd, env, timeoutMs = 30_000 } = opts;
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const settleReject = (err: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    };
    const settleResolve = (value: GhResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      settleReject(
        new GhError(
          "unknown",
          `gh ${args.join(" ")} timed out after ${timeoutMs}ms`,
          -1,
        ),
      );
    }, timeoutMs);
    child.stdout.on("data", (c: Buffer | string) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c: Buffer | string) => {
      stderr += c.toString();
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      // ENOENT means `gh` is not on PATH (spawn couldn't even start).
      if (err.code === "ENOENT") {
        settleReject(
          new GhError(
            "not_installed",
            "Install gh from https://cli.github.com",
            -1,
          ),
        );
      } else {
        settleReject(new GhError("unknown", err.message, -1));
      }
    });
    child.on("close", (exitCode) => {
      settleResolve({ stdout, stderr, exitCode: exitCode ?? -1 });
    });
  });
}

/**
 * Verify `gh` is installed AND authenticated. Throws a GhError with a
 * remediation hint on either failure.
 */
export async function ensureGh(): Promise<void> {
  const versionResult = await runGh(["--version"], { timeoutMs: 5_000 });
  if (versionResult.exitCode !== 0) {
    throw new GhError(
      "not_installed",
      "Install gh from https://cli.github.com",
      versionResult.exitCode,
    );
  }
  const authResult = await runGh(["auth", "status"], { timeoutMs: 5_000 });
  if (authResult.exitCode !== 0) {
    const stderr = authResult.stderr;
    if (/not logged into any GitHub hosts/i.test(stderr)) {
      throw new GhError(
        "not_authenticated",
        TOKEN_RENEW_HINT,
        authResult.exitCode,
      );
    }
    throw new GhError(
      "not_authenticated",
      stderr || "gh auth status failed",
      authResult.exitCode,
    );
  }
}

/**
 * Best-effort classifier for gh's stderr output. Returns a structured
 * hint so user-facing errors can point to the right remediation.
 */
export function parseGhError(stderr: string): {
  kind: GhErrorKind["kind"];
  hint: string;
} {
  if (/command not found|no such file/i.test(stderr)) {
    return {
      kind: "not_installed",
      hint: "Install gh from https://cli.github.com",
    };
  }
  if (/not logged into any GitHub hosts|not logged in|authentication failed|401/i.test(stderr)) {
    return { kind: "not_authenticated", hint: TOKEN_RENEW_HINT };
  }
  if (/rate limit|403/i.test(stderr)) {
    return {
      kind: "rate_limited",
      hint: "Wait or check https://github.com/settings/personal-access-tokens",
    };
  }
  if (/404|not found/i.test(stderr)) {
    return {
      kind: "not_found",
      hint: "Check the issue/PR number and repo permissions",
    };
  }
  return {
    kind: "unknown",
    hint: stderr.split("\n")[0] || "unknown error",
  };
}
