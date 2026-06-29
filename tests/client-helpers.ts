import { vi } from "vitest";

/**
 * Mocks globalThis.fetch with a queue of responses. Each call to the
 * returned `drain` function resolves the next queued response.
 *
 * Usage:
 *   const { enqueue, drain } = mockFetch();
 *   enqueue({ status: 200, body: { id: "1" } });
 *   await store.someAction();
 *   await drain();
 *   expect(...).toBe(...)
 */
export interface MockResponse {
  status?: number;
  body?: unknown;
  ok?: boolean;
}

export function mockFetch() {
  const queue: MockResponse[] = [];
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];

  const spy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, init });
      const next = queue.shift() ?? { status: 200, body: null };
      const status = next.status ?? (next.ok === false ? 500 : 200);
      const isJson = next.body !== null && next.body !== undefined;
      return new Response(
        isJson ? JSON.stringify(next.body) : null,
        {
          status,
          headers: isJson ? { "content-type": "application/json" } : {},
        },
      );
    });

  return {
    enqueue: (response: MockResponse) => {
      queue.push(response);
    },
    drain: async () => {
      // Wait for any in-flight microtasks so the store's await chain resolves
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    calls,
    restore: () => spy.mockRestore(),
  };
}
