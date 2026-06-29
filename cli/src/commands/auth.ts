import { Command } from "commander";
import { ApiClient } from "../client.js";
import {
  authMode,
  clearSession,
  loadSession,
  saveSession,
  sessionPath,
} from "../session.js";
import { jsonOut, success } from "../output.js";

interface UserDto {
  id: string;
  email: string;
  name: string;
  apiKey: string | null;
}

function client(program: Command): ApiClient {
  const opts = program.opts<{ url: string }>();
  return new ApiClient(opts.url);
}

function useJson(program: Command): boolean {
  return Boolean(program.opts<{ json?: boolean }>().json);
}

/**
 * Persist the user into the session file and, if the response didn't
 * come with an API key, call /rotate-api-key so the CLI always ends
 * the handshake with a stateless credential.
 */
async function persistUserWithApiKey(
  program: Command,
  user: UserDto,
): Promise<{ user: UserDto; apiKey: string | null }> {
  const baseUrl = program.opts<{ url: string }>().url;
  const existing = (await loadSession()) ?? { baseUrl };

  // Always update the user + baseUrl.
  existing.baseUrl = baseUrl;
  existing.user = { id: user.id, email: user.email, name: user.name };

  if (user.apiKey) {
    existing.apiKey = user.apiKey;
  } else {
    // No key on the user → rotate one. This endpoint requires auth,
    // so we need a session cookie to make the call. The login/register
    // responses we just received set that cookie for us, but we also
    // have to read it back into the session.
    const api = new ApiClient(baseUrl);
    try {
      const rotated = await api.post<{ apiKey: string }>(
        "/api/auth/rotate-api-key",
      );
      existing.apiKey = rotated.apiKey;
    } catch {
      // If rotate fails (e.g. no cookie either), leave it for the user
      // to retry with `dt auth rotate-key`.
    }
  }

  await saveSession(existing);
  return { user, apiKey: existing.apiKey ?? null };
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command("auth").description("Authentication commands");

  auth
    .command("login")
    .description("Log in with email + password, persist API key (~/.dev-tracker/session.json)")
    .requiredOption("--email <email>")
    .requiredOption("--password <password>")
    .action(async (opts: { email: string; password: string }) => {
      const json = useJson(program);
      const api = client(program);
      const user = await api.post<UserDto>("/api/auth/login", {
        email: opts.email,
        password: opts.password,
      });
      const result = await persistUserWithApiKey(program, user);
      success(
        `Logged in as ${user.email} (${user.name})`,
        json,
        { user: result.user, authMode: result.apiKey ? "apiKey" : "cookie" },
      );
    });

  auth
    .command("me")
    .description("Show the currently logged-in user and which auth mode is in use")
    .action(async () => {
      const json = useJson(program);
      const api = client(program);
      const user = await api.get<UserDto>("/api/auth/me");
      const session = await loadSession();
      const mode = authMode(session);
      if (json) {
        jsonOut({
          user: { id: user.id, email: user.email, name: user.name },
          authMode: mode,
          hasApiKey: Boolean(session?.apiKey),
        });
      } else {
        console.log(`${user.name} <${user.email}>`);
        console.log(`  id:        ${user.id}`);
        console.log(`  authMode:  ${mode}${session?.apiKey ? " (api key stored locally)" : ""}`);
      }
    });

  auth
    .command("logout")
    .description("Clear the local session file (does not invalidate server-side session)")
    .action(async () => {
      const json = useJson(program);
      const api = client(program);
      try {
        await api.post("/api/auth/logout");
      } catch {
        // Best-effort — even if the server call fails, we still clear local state.
      }
      await clearSession();
      success("Logged out", json);
    });

  auth
    .command("register")
    .description("Register a new user, then log in and persist an API key")
    .requiredOption("--email <email>")
    .requiredOption("--password <password>")
    .requiredOption("--name <name>")
    .action(async (opts: { email: string; password: string; name: string }) => {
      const json = useJson(program);
      const api = client(program);
      const user = await api.post<UserDto>("/api/auth/register", {
        email: opts.email,
        password: opts.password,
        name: opts.name,
      });
      const result = await persistUserWithApiKey(program, user);
      success(
        `Registered and logged in as ${user.email}`,
        json,
        { user: result.user, authMode: result.apiKey ? "apiKey" : "cookie" },
      );
    });

  auth
    .command("rotate-key")
    .description("Generate a new API key (replaces the one stored locally)")
    .action(async () => {
      const json = useJson(program);
      const api = client(program);
      const result = await api.post<{ apiKey: string }>(
        "/api/auth/rotate-api-key",
      );
      const existing = (await loadSession()) ?? {
        baseUrl: program.opts<{ url: string }>().url,
      };
      existing.apiKey = result.apiKey;
      await saveSession(existing);
      success("Rotated API key", json, { apiKey: result.apiKey });
    });

  auth
    .command("where")
    .description("Show the path of the local session file, the base URL, and current auth mode")
    .action(async () => {
      const session = await loadSession();
      const mode = authMode(session);
      console.log(`Session file: ${sessionPath()}`);
      console.log(`Base URL:     ${program.opts<{ url: string }>().url}`);
      console.log(`Auth mode:    ${mode}`);
      if (session?.user) {
        console.log(`User:         ${session.user.email}`);
      }
    });
}
