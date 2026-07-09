import { z } from "zod";
import { config } from "dotenv";

config({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default("file:./dev.db"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  // Directory for connect-sqlite3 session store. Default "." (CWD) for local dev;
  // Docker sets this to /app/data so sessions.db lands in the named volume.
  SESSIONS_DIR: z.string().default("."),
  ENGRAM_API_URL: z.string().default("http://127.0.0.1:7437"),
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
