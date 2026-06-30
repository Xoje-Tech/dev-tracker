/**
 * Error types raised by the DevTrackerClient implementations.
 *
 * - ClientValidationError: input or response failed Zod validation.
 *   Thrown synchronously for input failures, after the fetch round-trip
 *   for response failures. Carries the `endpoint` (e.g. "auth.register")
 *   so the caller knows which surface failed, and the raw Zod issues.
 * - ApiError: the server returned 4xx/5xx. Carries status, body, and
 *   (for known 401 cases) the `code` + `hint` the CLI uses to drive
 *   `dt auth rotate-key`.
 * - NetworkError: the underlying fetch threw (DNS, connection refused,
 *   etc.). The original error is on `.cause`.
 */
import type { z } from "zod";

export class ClientValidationError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly direction: "request" | "response",
    public readonly issues: z.ZodIssue[],
  ) {
    super(`Validation failed at ${endpoint} (${direction})`);
    this.name = "ClientValidationError";
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    public readonly code?: string,
    public readonly hint?: string,
  ) {
    super(
      hint
        ? `${ApiError.baseMessage(body) || `Request failed with status ${status}`} (${hint})`
        : ApiError.baseMessage(body) || `Request failed with status ${status}`,
    );
    this.name = "ApiError";
  }

  private static baseMessage(body: unknown): string {
    if (body && typeof body === "object") {
      const b = body as { message?: unknown; error?: unknown };
      if (typeof b.message === "string") return b.message;
      if (typeof b.error === "string") return b.error;
    }
    return "";
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

/** Type guard: was the thrown error an API 401? */
export function isAuthError(err: unknown): err is ApiError & { status: 401 } {
  return (
    err instanceof Error &&
    "status" in err &&
    (err as { status: unknown }).status === 401
  );
}
