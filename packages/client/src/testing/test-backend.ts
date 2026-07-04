/**
 * TestBackend — the surface a test backend must expose to be driven
 * by `InProcessDevTrackerClient`.
 *
 * Lives in `testing/` because the *interface* is reusable test
 * machinery: any test harness, agent harness, or fake that wants to
 * back the in-process client can implement this. The interface is
 * deliberately NOT a class — callers provide plain objects (often
 * inline literals in test files), keeping the dispatch surface
 * lightweight and easy to mock.
 *
 * Contract:
 *  - 1:1 with the 20 `DevTrackerClient` operations.
 *  - Return types are the Zod output shapes (UserOutput, ProjectOutput,
 *    BoardOutput, TaskOutput, TagOutput, …) so the in-process client
 *    can delegate with no casts and no runtime validation.
 *  - `reset()` is a test-isolation affordance — drop all state
 *    between cases.
 *  - `setCurrentUser()` is an optional auth affordance — switch the
 *    "session" the backend sees, mirroring how the HTTP client's
 *    session-cookie / API-key flow feels to callers.
 *
 * The implementation is trusted. The InProcessDevTrackerClient does
 * NO Zod parse on either inputs or outputs — this is the test path.
 * Validation belongs in the HTTP transport and in the backend
 * controllers.
 */
import type * as auth from "../schemas/auth.js";
import type * as projects from "../schemas/projects.js";
import type * as boards from "../schemas/boards.js";
import type * as tasks from "../schemas/tasks.js";
import type * as tags from "../schemas/tags.js";

export interface TestBackend {
  // ── auth ──────────────────────────────────────────────────────────
  register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<auth.UserOutput>;
  login(input: {
    email: string;
    password: string;
  }): Promise<auth.UserOutput>;
  logout(): Promise<auth.LogoutOutput>;
  me(): Promise<auth.UserOutput>;
  rotateApiKey(): Promise<auth.RotateApiKeyOutput>;

  // ── projects ──────────────────────────────────────────────────────
  listProjects(): Promise<projects.ProjectListOutput>;
  getProject(input: { id: string }): Promise<projects.ProjectOutput>;
  createProject(input: {
    name: string;
    description?: string;
  }): Promise<projects.ProjectOutput>;
  updateProject(input: {
    id: string;
    name?: string;
    description?: string | null;
  }): Promise<projects.ProjectOutput>;
  archiveProject(input: { id: string }): Promise<projects.ProjectOutput>;

  // ── boards ────────────────────────────────────────────────────────
  getBoard(input: { projectId: string }): Promise<boards.BoardOutput>;
  createDefaultBoard(input: {
    projectId: string;
  }): Promise<boards.BoardOutput>;

  // ── tasks ─────────────────────────────────────────────────────────
  createTask(input: {
    columnId: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    order: number;
    assigneeId?: string;
  }): Promise<tasks.TaskOutput>;
  updateTask(input: {
    id: string;
    title?: string;
    description?: string | null;
    priority?: "low" | "medium" | "high";
    assigneeId?: string | null;
  }): Promise<tasks.TaskOutput>;
  deleteTask(input: { id: string }): Promise<void>;
  moveTask(input: {
    id: string;
    targetColumnId: string;
    newIndex: number;
  }): Promise<tasks.TaskOutput>;

  // ── tags ──────────────────────────────────────────────────────────
  listTags(): Promise<tags.TagListOutput>;
  createTag(input: { name: string; color: string }): Promise<tags.TagOutput>;
  assignTag(input: { taskId: string; tagId: string }): Promise<void>;
  unassignTag(input: { taskId: string; tagId: string }): Promise<void>;

  // ── test affordances ──────────────────────────────────────────────

  /** Drop all state — for test isolation between cases. */
  reset(): Promise<void>;

  /**
   * Optional auth affordance: switch the "current user" the backend
   * sees, mirroring the HTTP client's session-cookie / API-key flow.
   * Pass `null` to simulate an unauthenticated request.
   */
  setCurrentUser?(user: { id: string } | null): Promise<void> | void;
}
