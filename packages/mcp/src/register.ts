/**
 * Tool registration orchestrator. Composes the per-domain registrars
 * (auth, projects, boards, tasks, tags) into a single idempotent call.
 *
 * Order is FIXED for NFR-3 deterministic ordering: auth, projects,
 * boards, tasks, tags. Tests assert this order.
 *
 * Idempotency is tracked with a module-level Set so that calling
 * `registerTools` twice with the same server is a no-op for already-
 * registered names. The SDK's `McpServer.tool()` does not dedupe; if
 * the same name is registered twice, the SDK throws an error. The
 * Set guard is the cheapest way to make this safe for tests that
 * re-register (and for any caller that wires the orchestrator twice).
 *
 * F4.1 ships only the orchestrator skeleton. The per-domain registrar
 * implementations (auth/projects/boards/tasks/tags) are added by
 * F4.2–F4.4 in fixed order. The `registerGuardedTool` helper added
 * in F4.2 will use the module-level `registered` set.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import { registerAuthTools } from "./tools/auth.js";
import { registerProjectsTools } from "./tools/projects.js";
import { registerBoardsTools } from "./tools/boards.js";
import { registerTagsTools } from "./tools/tags.js";

/** Module-level idempotency guard. */
const registered = new Set<string>();

/** Exposed for tests; useful for asserting the manifest after registration. */
export function isToolRegistered(name: string): boolean {
  return registered.has(name);
}

/** Test-only escape hatch — never call from production code. */
export function resetRegisteredTools(): void {
  registered.clear();
}

/**
 * Mark a tool name as registered. Returns `true` if the tool was
 * newly added (i.e. the caller should proceed to actually call
 * `server.tool(...)`); returns `false` if the tool was already
 * registered in this process (idempotency guard — skip the actual
 * SDK call so it doesn't throw).
 *
 * Exposed only inside this package via the tools/ registrars.
 */
export function trackToolRegistration(name: string): boolean {
  if (registered.has(name)) return false;
  registered.add(name);
  return true;
}

/**
 * Compact alias: returns `trackToolRegistration(name)` so the per-
 * domain registrars can do `if (guard("auth_register")) { ... }`
 * without repeating the closure.
 */
export const isToolRegisteredAndTrack = trackToolRegistration;

/**
 * Orchestrator. Per-domain registrars run in a FIXED order (NFR-3):
 * auth, projects, boards, tasks, tags.
 *
 * F4.2 wires auth + projects; F4.3 adds boards + tags; F4.4 adds
 * tasks and asserts the full 22-tool manifest.
 */
export function registerTools(
  server: McpServer,
  client: DevTrackerClient,
): void {
  registerAuthTools(server, client);
  registerProjectsTools(server, client);
  registerBoardsTools(server, client);
  registerTagsTools(server, client);
  // F4.4: registerTasksTools
}