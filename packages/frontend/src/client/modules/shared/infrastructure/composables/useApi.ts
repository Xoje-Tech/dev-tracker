export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

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

export function useApi(baseUrl = "/api") {
  async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, signal } = options;

    const init: RequestInit = {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${path}`, init);

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok) {
      throw buildError(response.status, payload);
    }

    return payload as T;
  }

  return {
    get: <T>(path: string, options?: Omit<ApiOptions, "method" | "body">) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T>(path: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
      request<T>(path, { ...options, method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
      request<T>(path, { ...options, method: "PATCH", body }),
    del: <T>(path: string, options?: Omit<ApiOptions, "method" | "body">) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof useApi>;
