/**
 * Test helpers for the CLI workspace.
 *
 * mockFetch() vi.spyOn's globalThis.fetch and replays a queue of
 * {status, body, headers} responses. Each test enqueues the responses
 * it needs, then asserts on how the code under test consumed them.
 *
 * Mirrors the pattern used by the frontend suite in tests/client-helpers.ts.
 */
import { vi } from "vitest";

export interface MockResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export function mockFetch(): {
  enqueue: (responses: MockResponse[]) => void;
  spy: ReturnType<typeof vi.spyOn> | undefined;
} {
  const queue: MockResponse[] = [];
  let spy: ReturnType<typeof vi.spyOn> | undefined;

  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const next = queue.shift();
    if (!next) {
      throw new Error(
        `mockFetch: no queued response for ${String(input)} (queue empty)`,
      );
    }
    const headers = new Headers({
      "content-type": "application/json",
      ...(next.headers ?? {}),
    });
    const bodyText =
      next.body === undefined
        ? ""
        : typeof next.body === "string"
          ? next.body
          : JSON.stringify(next.body);
    return new Response(bodyText, { status: next.status, headers });
  });

  spy = vi.spyOn(globalThis, "fetch").mockImplementation(
    impl as unknown as typeof fetch,
  );

  return {
    spy,
    enqueue(responses: MockResponse[]) {
      queue.push(...responses);
    },
  };
}
