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
}

function buildError(status: number, body: unknown): ApiError {
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed with status ${status}`;
  const err = new Error(message) as ApiError;
  err.status = status;
  err.body = body;
  return err;
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
