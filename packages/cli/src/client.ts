/**
 * CLI HTTP client — the CLI's HTTP surface.
 *
 * `ApiClient` (path-based `get/post/patch/del`) lives here because the
 * CLI commands speak a path-level API (`api.get("/api/projects")`),
 * not the typed 22-endpoint surface in `@dev-tracker/client`. All
 * shared client logic (Zod input/output schemas, `ApiError` shape,
 * `isAuthError`, `ClientValidationError`, `NetworkError`, `HttpDevTrackerClient`)
 * is re-exported from `@dev-tracker/client` so the CLI does not
 * duplicate any of it.
 *
 * Why is the HTTP request/response plumbing here (not in
 * `HttpDevTrackerClient`)? Because the CLI needs to capture
 * `Set-Cookie` headers on every response and persist them to
 * `~/.dev-tracker/session.json` so the next call is
 * auto-authenticated. That interception requires raw `fetch` with
 * access to `response.headers.getSetCookie()`, which
 * `HttpDevTrackerClient` (a pure typed transport) intentionally does
 * not expose. The CLI keeps this small, self-contained bit of HTTP
 * glue locally; everything else — auth header format, JSON encoding,
 * 401→`API_KEY_REVOKED` hint mapping — IS in the shared client and
 * mirrored here in lockstep.
 *
 * After F3.2 this file is reduced to:
 *   1. A re-export of the shared error types / type guard so legacy
 *      CLI imports keep working.
 *   2. A small `ApiClient` class that owns session persistence
 *      (Set-Cookie → session.json; apiKey-vs-cookie header priority).
 *   3. A `createApiClient(baseUrl)` factory that returns a typed
 *      `HttpDevTrackerClient` for new commands that prefer the 22-endpoint
 *      surface.
 */
import {
  ApiError as ClientApiError,
  HttpDevTrackerClient,
  isAuthError as clientIsAuthError,
} from "@dev-tracker/client";
import { loadSession, saveSession } from "./session.js";

// Re-exports for backward compatibility with existing CLI code.
export type ApiError = ClientApiError;
export { clientIsAuthError as isAuthError };

// Re-export session helpers so commands have a single import surface
// (`./client.js`) for auth+session+http concerns.
export { authMode, loadSession, saveSession } from "./session.js";

/**
 * Thin HTTP wrapper — adds session persistence on top of a raw
 * `fetch`. The auth header format, JSON encoding, and 401 error
 * mapping are kept here rather than pushed into
 * `HttpDevTrackerClient` because the CLI needs to intercept Set-Cookie
 * (see file header). HTTP-only behavior (auth headers, status-code
 * mapping, the hint string on 401) intentionally MIRRORS the shared
 * client's `HttpDevTrackerClient.buildError`; drift here is a bug.
 */
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

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const session = await loadSession();
    const headers: Record<string, string> = {};
    if (session?.apiKey) {
      headers["X-API-Key"] = session.apiKey;
    } else if (session?.cookieHeader) {
      headers["Cookie"] = session.cookieHeader;
    }
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
      // Build a shape-compatible ApiError. Mirrors
      // HttpDevTrackerClient.buildError: 401 → API_KEY_REVOKED + hint.
      // Both `isAuthError` and the `ApiError` type come from the
      // shared client (re-exported above), so callers that already
      // import those from here still get the canonical versions.
      const baseMessage =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message: unknown }).message)
          : typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: unknown }).error)
            : `Request failed with status ${response.status}`;
      const err = new Error(baseMessage) as Error & ApiError;
      (err as { status: number }).status = response.status;
      (err as { body: unknown }).body = payload;
      if (response.status === 401) {
        (err as { code?: string }).code = "API_KEY_REVOKED";
        (err as { hint?: string }).hint = "Try: dt auth rotate-key";
        err.message = `${err.message} (${(err as { hint?: string }).hint})`;
      }
      throw err;
    }

    return payload as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }
  del<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

/**
 * Factory mirroring the brief's recommended path — returns a typed
 * `HttpDevTrackerClient` for new CLI commands that prefer the typed
 * 22-endpoint surface over the legacy path-based `ApiClient`.
 */
export function createApiClient(baseUrl: string): HttpDevTrackerClient {
  return new HttpDevTrackerClient({ baseUrl });
}
