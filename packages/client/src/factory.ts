import { HttpDevTrackerClient } from "./http.js";
import type { TestBackend } from "./testing/test-backend.js";
import type { DevTrackerClient } from "./types.js";

/**
 * Discriminated union for client construction. Adding a new transport
 * is a TypeScript error in the switch below until it's handled.
 *
 * The `in-process` branch is retained for type completeness, but
 * `createDevTrackerClient` does NOT auto-construct in-process clients
 * — those need a `TestBackend` injection that the factory's
 * configuration surface cannot carry safely. Callers constructing
 * an in-process client should instantiate `InProcessDevTrackerClient`
 * directly and pass the backend they want to drive.
 */
export type ClientConfig =
  | {
      transport: "http";
      baseUrl: string;
      apiKey?: string;
      sessionCookie?: string;
    }
  | {
      transport: "in-process";
      backend: TestBackend;
    };

/**
 * Factory for `DevTrackerClient`. Returns the right implementation
 * based on `config.transport`. The switch is exhaustive — if you
 * add a new transport to `ClientConfig`, TypeScript will fail here
 * until you handle it.
 *
 * In-process clients require constructor injection of a
 * `TestBackend`, which is not expressible as a factory config
 * without forcing every caller to construct one. Callers wanting an
 * in-process client should use:
 *
 *     new InProcessDevTrackerClient(myBackend)
 */
export function createDevTrackerClient(config: ClientConfig): DevTrackerClient {
  switch (config.transport) {
    case "http":
      return new HttpDevTrackerClient(config);
    case "in-process":
      throw new Error(
        "createDevTrackerClient does not auto-create in-process clients. " +
          "Use `new InProcessDevTrackerClient(backend)` directly; the factory " +
          "cannot carry a TestBackend injection through its config surface.",
      );
  }
}
