/**
 * InProcessDevTrackerClient — the in-process transport for
 * DevTrackerClient. Wraps a TestBackend and delegates every call
 * without HTTP/serialization overhead.
 *
 * Use cases:
 *   - unit/integration tests that need to exercise the client without
 *     a running HTTP server,
 *   - the agent harness / "spawn an engineer" scenario where a CLI
 *     command runs against an in-memory backend.
 *
 * The backend is trusted — no response schema validation; the
 * Zod input schemas still run (cheap; consistency with HTTP variant)
 * so the same call sites work for both transports.
 *
 * Guarded against accidental production use: constructing this in
 * NODE_ENV=production throws. The HTTP variant is the only safe
 * choice in production.
 */
import type { DevTrackerClient } from "./types.js";
import * as auth from "./schemas/auth.js";
import * as projects from "./schemas/projects.js";
import * as boards from "./schemas/boards.js";
import * as tasks from "./schemas/tasks.js";
import * as tags from "./schemas/tags.js";

/**
 * TestBackend — the surface a TestBackend must expose.
 *
 * 1:1 with the 22 DevTrackerClient operations plus `reset()`. The
 * implementation is intentionally NOT validated by Zod — the
 * in-process client trusts the backend.
 *
 * Return types mirror the client's Zod output schemas (the
 * wire/JSON shape that transports must satisfy) so that the
 * InProcessDevTrackerClient's `Promise<TOutput>` shape lines up
 * with `DevTrackerClient` without a cast.
 */
export interface TestBackend {
  // auth
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

  // projects
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

  // boards
  getBoard(input: { projectId: string }): Promise<boards.BoardOutput>;
  createDefaultBoard(input: {
    projectId: string;
  }): Promise<boards.BoardOutput>;

  // tasks
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

  // tags
  listTags(): Promise<tags.TagListOutput>;
  createTag(input: { name: string; color: string }): Promise<tags.TagOutput>;
  assignTag(input: { taskId: string; tagId: string }): Promise<void>;
  unassignTag(input: { taskId: string; tagId: string }): Promise<void>;

  /** Drop all state — for test isolation between cases. */
  reset(): Promise<void>;
}

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

  auth = {
    register: async (input: auth.RegisterInput) => {
      await auth.registerInputSchema.parseAsync(input);
      return this.backend.register(input);
    },
    login: async (input: auth.LoginInput) => {
      await auth.loginInputSchema.parseAsync(input);
      return this.backend.login(input);
    },
    logout: async () => this.backend.logout(),
    me: async () => this.backend.me(),
    rotateApiKey: async () => this.backend.rotateApiKey(),
  };

  projects = {
    list: async (input: projects.ListProjectsInput = {}) => {
      await projects.listProjectsInputSchema.parseAsync(input);
      return this.backend.listProjects();
    },
    get: async (input: projects.GetProjectInput) => {
      await projects.getProjectInputSchema.parseAsync(input);
      return this.backend.getProject(input);
    },
    create: async (input: projects.CreateProjectInput) => {
      await projects.createProjectInputSchema.parseAsync(input);
      return this.backend.createProject(input);
    },
    update: async (input: projects.UpdateProjectInput) => {
      await projects.updateProjectInputSchema.parseAsync(input);
      return this.backend.updateProject(input);
    },
    archive: async (input: projects.ArchiveProjectInput) => {
      await projects.archiveProjectInputSchema.parseAsync(input);
      return this.backend.archiveProject(input);
    },
  };

  boards = {
    get: async (input: boards.GetBoardInput) => {
      await boards.getBoardInputSchema.parseAsync(input);
      return this.backend.getBoard(input);
    },
    createDefault: async (input: boards.CreateDefaultBoardInput) => {
      await boards.createDefaultBoardInputSchema.parseAsync(input);
      return this.backend.createDefaultBoard(input);
    },
  };

  tasks = {
    create: async (input: tasks.CreateTaskInput) => {
      await tasks.createTaskInputSchema.parseAsync(input);
      return this.backend.createTask(input);
    },
    update: async (input: tasks.UpdateTaskInput) => {
      await tasks.updateTaskInputSchema.parseAsync(input);
      return this.backend.updateTask(input);
    },
    delete: async (input: tasks.DeleteTaskInput) => {
      await tasks.deleteTaskInputSchema.parseAsync(input);
      await this.backend.deleteTask(input);
    },
    move: async (input: tasks.MoveTaskInput) => {
      await tasks.moveTaskInputSchema.parseAsync(input);
      return this.backend.moveTask(input);
    },
  };

  tags = {
    list: async (input: tags.ListTagsInput = {}) => {
      await tags.listTagsInputSchema.parseAsync(input);
      return this.backend.listTags();
    },
    create: async (input: tags.CreateTagInput) => {
      await tags.createTagInputSchema.parseAsync(input);
      return this.backend.createTag(input);
    },
    assign: async (input: tags.AssignTagInput) => {
      await tags.assignTagInputSchema.parseAsync(input);
      await this.backend.assignTag(input);
    },
    unassign: async (input: tags.UnassignTagInput) => {
      await tags.unassignTagInputSchema.parseAsync(input);
      await this.backend.unassignTag(input);
    },
  };
}
