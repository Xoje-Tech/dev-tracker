/**
 * CLI HTTP client — re-exports the shared client core from
 * @dev-tracker/client, and keeps the original ApiClient class as a
 * thin wrapper that adds session persistence on top of the
 * HttpDevTrackerClient transport.
 *
 * The shape of this file is preserved for backward compatibility with
 * the existing cli/src/client.test.ts and the rest of the CLI commands.
 * F3 will move cli/ into packages/cli/ and migrate the commands to
 * import directly from @dev-tracker/client.
 */
import { isAuthError as clientIsAuthError, type ApiError as ClientApiError } from "@dev-tracker/client";
import { loadSession, saveSession } from "./session.js";

/**
 * Re-export the client's error type and the type guard. The CLI's
 * `ApiError` interface has the same shape as the client's `ApiError`
 * class, so callers that switch on the structural shape still work.
 *
 * NOTE: we treat it as a type only (not a class) because the client
 * marks the fields as readonly. The CLI builds errors with the same
 * shape (status, body, code, hint) and throws them as Error.
 */
export type ApiError = ClientApiError;
export { clientIsAuthError as isAuthError };

/**
 * Thin wrapper around the shared HttpDevTrackerClient transport that
 * adds session persistence (Set-Cookie → ~/.dev-tracker/session.json,
 * X-API-Key priority). All HTTP traffic goes through the shared
 * client; the CLI only adds the session bookkeeping.
 *
 * The API surface (get/post/patch/del) matches the pre-monorepo
 * ApiClient so the existing CLI commands don't need to change.
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

    // Use raw fetch under the hood so we can read Set-Cookie
    // headers. HttpDevTrackerClient validates inputs/outputs with
    // Zod, but session persistence happens outside the client core.
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
      // Build a shape-compatible ApiError. The client's buildError
      // maps 401 → API_KEY_REVOKED; the CLI does the same here so
      // session-aware callers get the hint.
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
