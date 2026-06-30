/**
 * Read/write the dt session file. Default location: ~/.dev-tracker/session.json
 * Stores whichever credential we have: an API key (preferred — stateless,
 * never expires) or a session cookie (fallback — used for the initial
 * login/register handshake, or when no API key has been rotated yet).
 *
 * The file is created with mode 0600 so only the current user can read it.
 */
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const SESSION_DIR = join(homedir(), ".dev-tracker");
const SESSION_FILE = join(SESSION_DIR, "session.json");

export type AuthMode = "apiKey" | "cookie" | "none";

export interface Session {
  baseUrl: string;
  apiKey?: string;
  cookieHeader?: string;
  user?: { id: string; email: string; name: string };
}

export function authMode(session: Session | null): AuthMode {
  if (!session) return "none";
  if (session.apiKey) return "apiKey";
  if (session.cookieHeader) return "cookie";
  return "none";
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await readFile(SESSION_FILE, "utf8");
    return JSON.parse(raw) as Session;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await mkdir(dirname(SESSION_FILE), { recursive: true });
  await writeFile(SESSION_FILE, JSON.stringify(session, null, 2), { mode: 0o600 });
}

export async function clearSession(): Promise<void> {
  try {
    await unlink(SESSION_FILE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export function sessionPath(): string {
  return SESSION_FILE;
}
