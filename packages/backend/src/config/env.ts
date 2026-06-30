import { z } from "zod";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load .env files from the repo root regardless of CWD. We try the
 * process CWD first (so overrides like `pnpm dev` still work), then
 * fall back to walking up from this file's location to find the repo
 * root (where .env / .env.test live in a pnpm workspace).
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
function findEnvFile(name: string): string | undefined {
  const cwdCandidate = resolve(process.cwd(), name);
  if (existsSync(cwdCandidate)) return cwdCandidate;
  // Walk up to find the repo root (where pnpm-workspace.yaml lives).
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      const candidate = resolve(dir, name);
      if (existsSync(candidate)) return candidate;
    }
    dir = dirname(dir);
  }
  return undefined;
}

for (const name of [".env", ".env.test", ".env.local"]) {
  const path = findEnvFile(name);
  if (path) config({ path, override: name === ".env" });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default("file:./dev.db"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  // Directory for connect-sqlite3 session store. Default "." (CWD) for local dev;
  // Docker sets this to /app/data so sessions.db lands in the named volume.
  SESSIONS_DIR: z.string().default("."),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
