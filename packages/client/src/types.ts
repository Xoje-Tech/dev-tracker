/**
 * DevTrackerClient — the public contract between transports and
 * consumers (CLI, MCP, tests, agents).
 *
 * One method per backend endpoint (20 total): 5 auth + 5 projects +
 * 2 boards + 4 tasks + 4 tags. Inputs are validated by the matching
 * Zod input schema; outputs are validated by the matching Zod output
 * schema. Implementation lives in http.ts (HttpDevTrackerClient) and
 * in-process.ts (InProcessDevTrackerClient).
 */
import type {
  RegisterInput,
  UserOutput,
  LoginInput,
  LogoutOutput,
  RotateApiKeyOutput,
  EmptyInput,
} from "./schemas/auth.js";
import type {
  ListProjectsInput,
  ProjectListOutput,
  GetProjectInput,
  CreateProjectInput,
  UpdateProjectInput,
  ArchiveProjectInput,
  ProjectOutput,
} from "./schemas/projects.js";
import type {
  GetBoardInput,
  CreateDefaultBoardInput,
  BoardOutput,
} from "./schemas/boards.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  DeleteTaskInput,
  MoveTaskInput,
  TaskOutput,
} from "./schemas/tasks.js";
import type {
  ListTagsInput,
  CreateTagInput,
  AssignTagInput,
  UnassignTagInput,
  TagOutput,
  TagListOutput,
} from "./schemas/tags.js";

export interface DevTrackerClient {
  auth: {
    /** POST /api/auth/register — create a new user and start a session. */
    register: (input: RegisterInput) => Promise<UserOutput>;
    /** POST /api/auth/login — authenticate and start a session. */
    login: (input: LoginInput) => Promise<UserOutput>;
    /** POST /api/auth/logout — destroy the current session. */
    logout: () => Promise<LogoutOutput>;
    /** GET /api/auth/me — return the currently authenticated user. */
    me: () => Promise<UserOutput>;
    /** POST /api/auth/rotate-api-key — generate a new API key. */
    rotateApiKey: () => Promise<RotateApiKeyOutput>;
  };
  projects: {
    /** GET /api/projects — list the caller's projects. */
    list: (input?: ListProjectsInput) => Promise<ProjectListOutput>;
    /** GET /api/projects/:id — fetch one project by id. */
    get: (input: GetProjectInput) => Promise<ProjectOutput>;
    /** POST /api/projects — create a project (and a default board). */
    create: (input: CreateProjectInput) => Promise<ProjectOutput>;
    /** PATCH /api/projects/:id — partial update. */
    update: (input: UpdateProjectInput) => Promise<ProjectOutput>;
    /** POST /api/projects/:id/archive — soft-archive. */
    archive: (input: ArchiveProjectInput) => Promise<ProjectOutput>;
  };
  boards: {
    /** GET /api/projects/:projectId/board — fetch a project's board + columns + tasks. */
    get: (input: GetBoardInput) => Promise<BoardOutput>;
    /** POST /api/projects/:projectId/board — create the default board. */
    createDefault: (input: CreateDefaultBoardInput) => Promise<BoardOutput>;
  };
  tasks: {
    /** POST /api/tasks — create a task in a column. */
    create: (input: CreateTaskInput) => Promise<TaskOutput>;
    /** PATCH /api/tasks/:id — partial update. */
    update: (input: UpdateTaskInput) => Promise<TaskOutput>;
    /** DELETE /api/tasks/:id — delete a task. */
    delete: (input: DeleteTaskInput) => Promise<void>;
    /** POST /api/tasks/:id/move — move a task to a column at an index. */
    move: (input: MoveTaskInput) => Promise<TaskOutput>;
  };
  tags: {
    /** GET /api/tags — list all tags. */
    list: (input?: ListTagsInput) => Promise<TagListOutput>;
    /** POST /api/tags — create a tag. */
    create: (input: CreateTagInput) => Promise<TagOutput>;
    /** POST /api/tasks/:taskId/tags/:tagId — assign tag to task. */
    assign: (input: AssignTagInput) => Promise<void>;
    /** DELETE /api/tasks/:taskId/tags/:tagId — remove tag from task. */
    unassign: (input: UnassignTagInput) => Promise<void>;
  };
}

// Re-export placeholder so TS does not strip the import — the type
// aliases above come from the schema files but `EmptyInput` and
// `EmptyInput`-shaped methods are not currently on the interface.
export type { EmptyInput };
