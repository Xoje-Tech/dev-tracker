/**
 * InProcessDevTrackerClient — the in-process transport for
 * `DevTrackerClient`. Wraps a `TestBackend` and delegates every call
 * without HTTP or serialization overhead.
 *
 * Use cases:
 *  - unit/integration tests that exercise the client without a
 *    running HTTP server,
 *  - agent harnesses that need an in-memory backend.
 *
 * This is a thin adapter: the `TestBackend` does the real work, and
 * the methods here are 1:1 delegations. No Zod parse runs here — the
 * test backend is trusted (validation lives in the HTTP client and in
 * the backend's controllers).
 *
 * Guarded against accidental production use: constructing this in
 * `NODE_ENV=production` throws. The HTTP variant is the only safe
 * choice in production.
 */
import type { DevTrackerClient } from "./types.js";
import type { TestBackend } from "./testing/test-backend.js";

export class InProcessDevTrackerClient implements DevTrackerClient {
  constructor(private readonly backend: TestBackend) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error(
        "InProcessDevTrackerClient is not safe in production — use HttpDevTrackerClient. " +
          "In-process clients trust the backend; there is no schema enforcement on responses, " +
          "no auth boundary, and the process cannot be horizontally scaled.",
      );
    }
  }

  // ── auth ──────────────────────────────────────────────────────────
  auth = {
    register: (input: Parameters<DevTrackerClient["auth"]["register"]>[0]) =>
      this.backend.register(input),
    login: (input: Parameters<DevTrackerClient["auth"]["login"]>[0]) =>
      this.backend.login(input),
    logout: () => this.backend.logout(),
    me: () => this.backend.me(),
    rotateApiKey: () => this.backend.rotateApiKey(),
  };

  // ── projects ──────────────────────────────────────────────────────
  projects = {
    list: (
      _input?: Parameters<DevTrackerClient["projects"]["list"]>[0],
    ) => this.backend.listProjects(),
    get: (input: Parameters<DevTrackerClient["projects"]["get"]>[0]) =>
      this.backend.getProject(input),
    create: (input: Parameters<DevTrackerClient["projects"]["create"]>[0]) =>
      this.backend.createProject(input),
    update: (input: Parameters<DevTrackerClient["projects"]["update"]>[0]) =>
      this.backend.updateProject(input),
    archive: (input: Parameters<DevTrackerClient["projects"]["archive"]>[0]) =>
      this.backend.archiveProject(input),
  };

  // ── boards ────────────────────────────────────────────────────────
  boards = {
    get: (input: Parameters<DevTrackerClient["boards"]["get"]>[0]) =>
      this.backend.getBoard(input),
    createDefault: (
      input: Parameters<DevTrackerClient["boards"]["createDefault"]>[0],
    ) => this.backend.createDefaultBoard(input),
  };

  // ── tasks ─────────────────────────────────────────────────────────
  tasks = {
    create: (input: Parameters<DevTrackerClient["tasks"]["create"]>[0]) =>
      this.backend.createTask(input),
    update: (input: Parameters<DevTrackerClient["tasks"]["update"]>[0]) =>
      this.backend.updateTask(input),
    delete: (input: Parameters<DevTrackerClient["tasks"]["delete"]>[0]) =>
      this.backend.deleteTask(input),
    move: (input: Parameters<DevTrackerClient["tasks"]["move"]>[0]) =>
      this.backend.moveTask(input),
  };

  // ── tags ──────────────────────────────────────────────────────────
  tags = {
    list: (_input?: Parameters<DevTrackerClient["tags"]["list"]>[0]) =>
      this.backend.listTags(),
    create: (input: Parameters<DevTrackerClient["tags"]["create"]>[0]) =>
      this.backend.createTag(input),
    assign: (input: Parameters<DevTrackerClient["tags"]["assign"]>[0]) =>
      this.backend.assignTag(input),
    unassign: (input: Parameters<DevTrackerClient["tags"]["unassign"]>[0]) =>
      this.backend.unassignTag(input),
  };
}
