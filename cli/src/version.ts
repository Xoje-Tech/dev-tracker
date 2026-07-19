/**
 * CLI version detection.
 *
 * Reads the package.json from one of several candidate locations and
 * returns the version string. Falls back to "unknown" if none can be
 * resolved — never throws, because version lookup is purely cosmetic
 * for status output and must not break command execution.
 *
 * Candidate locations, in priority order:
 *   1. DT_CLI_VERSION env var (build-time injection via pkg config).
 *   2. ../package.json (works when CLI runs from cli/dist via pnpm).
 *   3. ../../package.json (works when CLI runs from a bin wrapper that
 *      lives one level below the install root).
 *   4. ./package.json (last-ditch — when run from inside the repo root).
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const FALLBACK_VERSION = "unknown";

/**
 * Try to find the package.json by walking up from the current module's
 * directory looking for the first package.json that contains a matching
 * name. This is more robust than the hardcoded candidate list and
 * works in dev (tsx), test (vitest), and production (pkg bundle) modes.
 */
function findPackageJson(): string | null {
  // Resolve the directory of THIS file. CJS uses __dirname; in CJS-bundled
  // output (pkg, tsc) we always have __dirname. We don't bother with ESM
  // import.meta.url because the CLI is compiled as CommonJS (per
  // cli/tsconfig.json: module: CommonJS).
  let here: string = __dirname;

  // Walk up at most 6 levels. 6 is generous: the CLI source lives at
  // cli/src/, so the package.json is 3 levels up from any code file.
  for (let depth = 0; depth < 6; depth++) {
    const candidate = join(here, "package.json");
    if (existsSync(candidate)) {
      try {
        const parsed = JSON.parse(readFileSync(candidate, "utf-8")) as {
          name?: string;
        };
        // Match by name to be sure we picked the CLI's package.json, not
        // some random package.json we found in the tree (e.g. in tests).
        if (parsed.name === "dev-tracker-cli") return candidate;
      } catch {
        // unparseable — keep walking
      }
    }
    const parent = dirname(here);
    if (parent === here) break; // hit filesystem root
    here = parent;
  }

  // Fallback: search from process.cwd(). Useful when the module is
  // bundled by vite-node into a different directory (vitest test runs).
  // We walk up to 6 levels from cwd too.
  try {
    let startCwd: string = process.cwd();
    for (let depth = 0; depth < 6; depth++) {
      const candidate = join(startCwd, "package.json");
      if (existsSync(candidate)) {
        try {
          const parsed = JSON.parse(readFileSync(candidate, "utf-8")) as {
            name?: string;
          };
          if (parsed.name === "dev-tracker-cli") return candidate;
        } catch {
          // ignore
        }
      }
      const parent = dirname(startCwd);
      if (parent === startCwd) break;
      startCwd = parent;
    }
  } catch {
    // ignore
  }

  return null;
}

let cachedVersion: string | null = null;

/**
 * Returns the CLI version string. Cached after first successful read.
 *
 * Resolution order:
 *   1. `DT_CLI_VERSION` env var (set at build time, e.g. via pkg config)
 *   2. The CLI's own `package.json` walking up from the module location
 *      AND from process.cwd() as fallback
 *   3. The literal string "unknown" (never throws)
 *
 * Cache semantics: simple process-level cache. To force a re-read
 * (e.g. in tests after mutating DT_CLI_VERSION), call
 * `resetCliVersionCache()`.
 */
export function getCliVersion(): string {
  if (cachedVersion !== null) return cachedVersion;

  const envVersion = process.env.DT_CLI_VERSION?.trim();
  if (envVersion && envVersion.length > 0) {
    cachedVersion = envVersion;
    return cachedVersion;
  }

  const pkgPath = findPackageJson();
  if (pkgPath !== null) {
    try {
      const parsed = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        version?: string;
      };
      if (parsed.version && typeof parsed.version === "string") {
        cachedVersion = parsed.version;
        return cachedVersion;
      }
    } catch {
      // fall through to FALLBACK_VERSION
    }
  }

  cachedVersion = FALLBACK_VERSION;
  return cachedVersion;
}

/** Test-only: reset the module-level cache. */
export function resetCliVersionCache(): void {
  cachedVersion = null;
}

/** Test-only: get the resolved package.json path (or null). */
export function getCliPackageJsonPath(): string | null {
  return findPackageJson();
}

/** Test-only: resolve the absolute path that would be checked next. */
export function resolveFromCwd(cwd: string = process.cwd()): string | null {
  const candidate = resolve(cwd, "package.json");
  if (!existsSync(candidate)) return null;
  try {
    const parsed = JSON.parse(readFileSync(candidate, "utf-8")) as {
      name?: string;
    };
    if (parsed.name === "dev-tracker-cli") return candidate;
  } catch {
    // ignore
  }
  return null;
}