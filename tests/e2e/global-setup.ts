import { execSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";

/**
 * Playwright global setup — runs ONCE before webServer starts.
 *
 * Why we rename `.env` to `.env.bak`:
 *   src/config/env.ts calls `dotenv.config({ override: true })` with no path,
 *   so it ALWAYS loads `.env` and overrides anything in process.env. That
 *   means even if Playwright's webServer.env sets DATABASE_URL=file:./e2e.db,
 *   the real `.env` (which points at dev.db) will clobber it.
 *
 *   We rename `.env` out of the way so webServer.env values take effect.
 *   `tests/e2e/global-teardown.ts` restores it.
 *
 * We then run `prisma db push --force-reset --skip-generate` against the
 * e2e database (resolved relative to schema.prisma → prisma/e2e.db).
 */
export default async function globalSetup(): Promise<void> {
  const envPath = ".env";
  const bakPath = ".env.bak";

  if (existsSync(envPath) && !existsSync(bakPath)) {
    renameSync(envPath, bakPath);
  }

  const e2eDb = "prisma/e2e.db";
  for (const suffix of ["", "-journal", "-shm", "-wal"]) {
    const path = `${e2eDb}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }

  execSync("pnpm exec prisma db push --force-reset --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./e2e.db" },
    stdio: "inherit",
  });
}