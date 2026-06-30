import { existsSync, renameSync } from "node:fs";

/**
 * Playwright global teardown — restores `.env` after the suite so the dev
 * environment works normally again. Runs once after all tests.
 */
export default async function globalTeardown(): Promise<void> {
  const envPath = ".env";
  const bakPath = ".env.bak";
  if (existsSync(bakPath) && !existsSync(envPath)) {
    renameSync(bakPath, envPath);
  }
}