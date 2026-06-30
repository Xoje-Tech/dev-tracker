import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

/**
 * Global setup — runs ONCE before all vitest workers spin up.
 * Resets the test SQLite database and pushes the Prisma schema.
 *
 * Vitest v4 requires this to export a `setup` async function.
 *
 * Note: process.cwd() varies by package (backend vs. root). Prisma's
 * schema lives at the repo root, so we resolve it explicitly and run
 * `prisma db push` from the repo root regardless of which package
 * triggered vitest.
 */
export async function setup(): Promise<void> {
  config({ path: ".env.test" });
  process.env.NODE_ENV = "test";

  // Walk up to the repo root (where pnpm-workspace.yaml lives) and run
  // prisma db push from there with --schema pointing at the root schema.
  const repoRoot = resolve(process.cwd(), "..", "..");
  const testDbPath = resolve(repoRoot, "prisma", "test.db");

  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }

  execSync("npx prisma db push --skip-generate --force-reset", {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
