/**
 * Minimal HTTP client for the dev-tracker REST API.
 *
 * Auth priority: X-API-Key header (if we have a key) > Cookie header (fallback).
 * The first response that returns Set-Cookie persists the cookie into the
 * session file so subsequent calls can use either auth method.
 */
import { loadSession, saveSession } from "./session.js";

export interface ApiError extends Error {
  status: number;
  body: unknown;
  /** Short machine-readable code, e.g. "API_KEY_REVOKED" on 401. */
  code?: string;
  /** Human-friendly remediation hint appended to the error message and
   *  surfaced in JSON output under `hint`. */
  hint?: string;
}

/** Human-readable next-step hints for specific status codes. */
const STATUS_HINTS: Record<number, { code: string; hint: string }> = {
  401: {
    code: "API_KEY_REVOKED",
    hint: "Try: dt auth rotate-key",
  },
};

function buildError(status: number, body: unknown): ApiError {
  const baseMessage =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed with status ${status}`;
  const err = new Error(baseMessage) as ApiError;
  err.status = status;
  err.body = body;
  // Attach structured hint/code for known failure modes so callers can
  // surface them in both human and JSON output without re-parsing the body.
  const annotated = STATUS_HINTS[status];
  if (annotated) {
    err.code = annotated.code;
    err.hint = annotated.hint;
    err.message = `${baseMessage} (${annotated.hint})`;
  }
  return err;
}

/** Type guard: is the thrown error a 401 from the API? */
export function isAuthError(err: unknown): err is ApiError & { status: 401 } {
  return (
    err instanceof Error &&
    "status" in err &&
    (err as { status: unknown }).status === 401
  );
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async persistCookies(response: Response): Promise<void> {
    const setCookies = (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.();
    if (!setCookies || setCookies.length === 0) return;
    const existing = (await loadSession()) ?? { baseUrl: this.baseUrl };
    const pairs = setCookies.map((c) => c.split(";")[0]).filter(Boolean);
    existing.cookieHeader = pairs.join("; ");
    existing.baseUrl = this.baseUrl;
    await saveSession(existing);
  }

  private async authHeaders(session: Awaited<ReturnType<typeof loadSession>>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    if (session?.apiKey) {
      headers["X-API-Key"] = session.apiKey;
    } else if (session?.cookieHeader) {
      headers["Cookie"] = session.cookieHeader;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const session = await loadSession();
    const headers: Record<string, string> = {
      ...(await this.authHeaders(session)),
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    await this.persistCookies(response);

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok) {
      throw buildError(response.status, payload);
    }

    return payload as T;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }
  del<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

// Re-export so commands don't need to import session.ts separately.
export { authMode, loadSession, saveSession } from "./session.js";
