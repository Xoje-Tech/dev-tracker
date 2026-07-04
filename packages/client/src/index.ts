/**
 * @dev-tracker/client — public surface.
 *
 * Single source of truth for the DTOs, errors, and operations shared
 * between dev-tracker's HTTP backend, CLI, and MCP transports.
 * Backed by two interchangeable implementations (HttpDevTrackerClient
 * for production, InProcessDevTrackerClient for tests/dev).
 */

// Types
export type { DevTrackerClient } from "./types.js";

// Factory
export { createDevTrackerClient, type ClientConfig } from "./factory.js";

// Errors
export {
  ClientValidationError,
  ApiError,
  NetworkError,
  isAuthError,
} from "./errors.js";

// Implementations
export { HttpDevTrackerClient } from "./http.js";
export { InProcessDevTrackerClient } from "./in-process.js";
export { type TestBackend } from "./testing/test-backend.js";

// Backward-compat alias: cli/src/client.ts historically exported
// `ApiClient` as the class name. Keep the alias so legacy imports
// continue to compile. (F3 will remove cli/src/client.ts entirely
// and migrate its callers to use HttpDevTrackerClient directly.)
import type { HttpDevTrackerClient as _HttpDevTrackerClient } from "./http.js";
export type ApiClient = _HttpDevTrackerClient;

// Zod schemas + inferred types — auth
export {
  registerInputSchema,
  type RegisterInput,
  loginInputSchema,
  type LoginInput,
  emptyInputSchema,
  type EmptyInput,
  userOutputSchema,
  type UserOutput,
  logoutOutputSchema,
  type LogoutOutput,
  rotateApiKeyOutputSchema,
  type RotateApiKeyOutput,
} from "./schemas/auth.js";

// Zod schemas + inferred types — projects
export {
  listProjectsInputSchema,
  type ListProjectsInput,
  getProjectInputSchema,
  type GetProjectInput,
  createProjectInputSchema,
  type CreateProjectInput,
  updateProjectInputSchema,
  type UpdateProjectInput,
  archiveProjectInputSchema,
  type ArchiveProjectInput,
  projectOutputSchema,
  type ProjectOutput,
  projectListOutputSchema,
  type ProjectListOutput,
} from "./schemas/projects.js";

// Zod schemas + inferred types — boards
export {
  boardTaskOutputSchema,
  type BoardTaskOutput,
  boardColumnOutputSchema,
  type BoardColumnOutput,
  boardOutputSchema,
  type BoardOutput,
  getBoardInputSchema,
  type GetBoardInput,
  createDefaultBoardInputSchema,
  type CreateDefaultBoardInput,
} from "./schemas/boards.js";

// Zod schemas + inferred types — tasks
export {
  createTaskInputSchema,
  type CreateTaskInput,
  updateTaskInputSchema,
  type UpdateTaskInput,
  deleteTaskInputSchema,
  type DeleteTaskInput,
  moveTaskInputSchema,
  type MoveTaskInput,
  taskOutputSchema,
  type TaskOutput,
} from "./schemas/tasks.js";

// Zod schemas + inferred types — tags
export {
  listTagsInputSchema,
  type ListTagsInput,
  createTagInputSchema,
  type CreateTagInput,
  assignTagInputSchema,
  type AssignTagInput,
  unassignTagInputSchema,
  type UnassignTagInput,
  tagOutputSchema,
  type TagOutput,
  tagListOutputSchema,
  type TagListOutput,
} from "./schemas/tags.js";
