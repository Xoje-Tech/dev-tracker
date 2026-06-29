import { config } from "dotenv";
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

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
