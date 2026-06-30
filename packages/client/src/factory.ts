import { HttpDevTrackerClient } from "./http.js";
import { InProcessDevTrackerClient, type TestBackend } from "./in-process.js";
import type { DevTrackerClient } from "./types.js";

/**
 * Discriminated union for client construction. Adding a new transport
 * is a TypeScript error in the switch below until it's handled.
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
 */
export function createDevTrackerClient(config: ClientConfig): DevTrackerClient {
  switch (config.transport) {
    case "http":
      return new HttpDevTrackerClient(config);
    case "in-process":
      return new InProcessDevTrackerClient(config.backend);
  }
}
