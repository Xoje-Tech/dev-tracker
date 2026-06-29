import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

/**
 * Global setup — runs ONCE before all vitest workers spin up.
 * Resets the test SQLite database and pushes the Prisma schema.
 *
 * Vitest v4 requires this to export a `setup` async function.
 */
export async function setup(): Promise<void> {
  config({ path: ".env.test" });
  process.env.NODE_ENV = "test";

  const testDbPath = resolve(process.cwd(), "prisma", "test.db");

  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }

  execSync("npx prisma db push --skip-generate --force-reset", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
