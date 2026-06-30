/**
 * Per-tool glue: wraps a `DevTrackerClient` method call into an MCP
 * tool callback that returns `CallToolResult`.
 *
 * - Inputs are already validated by the SDK via the Zod schema we
 *   pass to `server.tool(...)`. We do NOT re-validate here.
 * - On error, we return `{ isError: true, content: [...] }` with a
 *   sanitized message — no stack traces, no internal types.
 * - Output is wrapped as a JSON `text` content block so MCP clients
 *   that only render text see something readable; structured clients
 *   can still parse the underlying JSON.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import {
  ApiError,
  ClientValidationError,
  NetworkError,
} from "@dev-tracker/client";

/** Sanitize a thrown error into a user-safe message. */
export function sanitizeMessage(err: unknown): string {
  if (err instanceof ClientValidationError) {
    return `validation failed at ${err.endpoint} (${err.direction})`;
  }
  if (err instanceof ApiError) {
    const hint = err.hint ? ` — ${err.hint}` : "";
    return `API error ${err.status}${hint}`;
  }
  if (err instanceof NetworkError) {
    return `network error: ${err.message}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export function toToolResult(value: unknown): CallToolResult {
  const text = JSON.stringify(value, null, 2);
  return {
    content: [{ type: "text", text }],
  };
}

export function toErrorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

/**
 * Extract the raw shape from a Zod object schema — the SDK's
 * `server.tool(...)` expects a `ZodRawShape` (key → ZodType), not a
 * `ZodObject` wrapper.
 */
export function shapeOf<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
): z.ZodRawShape {
  return schema.shape;
}

/**
 * Pass-through helper (currently identity) kept for symmetry with
 * `shapeOf` so callers can document their intent.
 */
export function asSchema<S>(schema: S): S {
  return schema;
}

/**
 * Wrap a method that takes no input into a `ToolCallback` suitable
 * for `server.registerTool(name, { inputSchema, description }, cb)`.
 * Returned callback signature is `(args, extra) => Promise<CallToolResult>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapNoInputTool(
  method: () => Promise<unknown>,
): (args: any, extra: any) => Promise<CallToolResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (_args: any, _extra: any) => {
    try {
      const result = await method();
      return toToolResult(result);
    } catch (err) {
      return toErrorResult(sanitizeMessage(err));
    }
  };
}

/**
 * Wrap a client method that takes a typed input into a `ToolCallback`
 * suitable for `server.tool(name, description, paramsSchema, cb)`.
 *
 * The returned callback has signature `(args, extra) => Promise<CallToolResult>`.
 * The first arg is the SDK-validated input (already parsed against
 * the Zod schema we pass in).
 */
// `any` here is intentional: the SDK infers its callback's `args` from
// `ShapeOutput<ZodRawShape>` which collapses to `Record<string, unknown>`,
// and unifying that with a precise typed input shape fails overload
// resolution. The wrapper is internal — each call site knows the
// concrete TInput and we pass it through to the typed client method.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapInputTool<TInput>(
  method: (input: TInput) => Promise<unknown>,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): (args: any, extra: any) => Promise<CallToolResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (args: any) => {
    try {
      const result = await method(args as TInput);
      return toToolResult(result);
    } catch (err) {
      return toErrorResult(sanitizeMessage(err));
    }
  };
}