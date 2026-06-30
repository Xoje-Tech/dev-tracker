/**
 * HttpDevTrackerClient — the HTTP transport for DevTrackerClient.
 *
 * One method per backend endpoint (22 total). Every method:
 *   1. Validates input against the matching XxxInputSchema (throws
 *      ClientValidationError synchronously before fetch if invalid).
 *   2. Sends fetch with the chosen auth header (X-API-Key if apiKey
 *      is set, else Cookie header).
 *   3. Validates the response body against XxxOutputSchema (throws
 *      ClientValidationError after fetch if the server returned
 *      something unexpected).
 *   4. Maps non-2xx to ApiError (carrying 401 hint/code), and thrown
 *      fetch to NetworkError.
 *
 * No Set-Cookie persistence — the CLI session layer owns cookies;
 * the client core just carries them in the request.
 */
import {
  ApiError,
  ClientValidationError,
  NetworkError,
} from "./errors.js";
import * as auth from "./schemas/auth.js";
import * as projects from "./schemas/projects.js";
import * as boards from "./schemas/boards.js";
import * as tasks from "./schemas/tasks.js";
import * as tags from "./schemas/tags.js";
import type { DevTrackerClient } from "./types.js";

export interface HttpDevTrackerClientOptions {
  baseUrl: string;
  apiKey?: string;
  sessionCookie?: string;
}

/** Body-bearing fetch methods. */
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/** z.ZodTypeAny substitute — keep the dependency on z minimal here. */
type ZodLike<T> = { parseAsync(input: unknown): Promise<T> };

export class HttpDevTrackerClient implements DevTrackerClient {
  constructor(private readonly opts: HttpDevTrackerClientOptions) {}

  // ---------- public surface ----------

  auth = {
    register: (input: auth.RegisterInput) =>
      this.request(
        "auth.register",
        "POST",
        "/api/auth/register",
        input,
        auth.registerInputSchema,
        auth.userOutputSchema,
      ),
    login: (input: auth.LoginInput) =>
      this.request(
        "auth.login",
        "POST",
        "/api/auth/login",
        input,
        auth.loginInputSchema,
        auth.userOutputSchema,
      ),
    logout: () =>
      this.request(
        "auth.logout",
        "POST",
        "/api/auth/logout",
        undefined,
        auth.emptyInputSchema,
        auth.logoutOutputSchema,
      ),
    me: () =>
      this.request(
        "auth.me",
        "GET",
        "/api/auth/me",
        undefined,
        auth.emptyInputSchema,
        auth.userOutputSchema,
      ),
    rotateApiKey: () =>
      this.request(
        "auth.rotateApiKey",
        "POST",
        "/api/auth/rotate-api-key",
        undefined,
        auth.emptyInputSchema,
        auth.rotateApiKeyOutputSchema,
      ),
  };

  projects = {
    list: (input: projects.ListProjectsInput = {}) =>
      this.request(
        "projects.list",
        "GET",
        "/api/projects",
        input,
        projects.listProjectsInputSchema,
        projects.projectListOutputSchema,
      ),
    get: (input: projects.GetProjectInput) =>
      this.request(
        "projects.get",
        "GET",
        `/api/projects/${encodeURIComponent(input.id)}`,
        input,
        projects.getProjectInputSchema,
        projects.projectOutputSchema,
      ),
    create: (input: projects.CreateProjectInput) =>
      this.request(
        "projects.create",
        "POST",
        "/api/projects",
        input,
        projects.createProjectInputSchema,
        projects.projectOutputSchema,
      ),
    update: (input: projects.UpdateProjectInput) =>
      this.request(
        "projects.update",
        "PATCH",
        `/api/projects/${encodeURIComponent(input.id)}`,
        input,
        projects.updateProjectInputSchema,
        projects.projectOutputSchema,
      ),
    archive: (input: projects.ArchiveProjectInput) =>
      this.request(
        "projects.archive",
        "POST",
        `/api/projects/${encodeURIComponent(input.id)}/archive`,
        input,
        projects.archiveProjectInputSchema,
        projects.projectOutputSchema,
      ),
  };

  boards = {
    get: (input: boards.GetBoardInput) =>
      this.request(
        "boards.get",
        "GET",
        `/api/projects/${encodeURIComponent(input.projectId)}/board`,
        input,
        boards.getBoardInputSchema,
        boards.boardOutputSchema,
      ),
    createDefault: (input: boards.CreateDefaultBoardInput) =>
      this.request(
        "boards.createDefault",
        "POST",
        `/api/projects/${encodeURIComponent(input.projectId)}/board`,
        input,
        boards.createDefaultBoardInputSchema,
        boards.boardOutputSchema,
      ),
  };

  tasks = {
    create: (input: tasks.CreateTaskInput) =>
      this.request(
        "tasks.create",
        "POST",
        "/api/tasks",
        input,
        tasks.createTaskInputSchema,
        tasks.taskOutputSchema,
      ),
    update: (input: tasks.UpdateTaskInput) =>
      this.request(
        "tasks.update",
        "PATCH",
        `/api/tasks/${encodeURIComponent(input.id)}`,
        input,
        tasks.updateTaskInputSchema,
        tasks.taskOutputSchema,
      ),
    delete: (input: tasks.DeleteTaskInput) =>
      this.request(
        "tasks.delete",
        "DELETE",
        `/api/tasks/${encodeURIComponent(input.id)}`,
        input,
        tasks.deleteTaskInputSchema,
        // z.void() equivalent — let undefined body through.
        undefined as unknown as ZodLike<void>,
      ),
    move: (input: tasks.MoveTaskInput) =>
      this.request(
        "tasks.move",
        "POST",
        `/api/tasks/${encodeURIComponent(input.id)}/move`,
        input,
        tasks.moveTaskInputSchema,
        tasks.taskOutputSchema,
      ),
  };

  tags = {
    list: (input: tags.ListTagsInput = {}) =>
      this.request(
        "tags.list",
        "GET",
        "/api/tags",
        input,
        tags.listTagsInputSchema,
        tags.tagListOutputSchema,
      ),
    create: (input: tags.CreateTagInput) =>
      this.request(
        "tags.create",
        "POST",
        "/api/tags",
        input,
        tags.createTagInputSchema,
        tags.tagOutputSchema,
      ),
    assign: (input: tags.AssignTagInput) =>
      this.request(
        "tags.assign",
        "POST",
        `/api/tasks/${encodeURIComponent(input.taskId)}/tags/${encodeURIComponent(input.tagId)}`,
        input,
        tags.assignTagInputSchema,
        // void response
        undefined as unknown as ZodLike<void>,
      ),
    unassign: (input: tags.UnassignTagInput) =>
      this.request(
        "tags.unassign",
        "DELETE",
        `/api/tasks/${encodeURIComponent(input.taskId)}/tags/${encodeURIComponent(input.tagId)}`,
        input,
        tags.unassignTagInputSchema,
        // void response
        undefined as unknown as ZodLike<void>,
      ),
  };

  // ---------- internals ----------

  /**
   * Validate input, send fetch, validate response, map errors. One
   * place does all the work so the 22 methods above stay tiny.
   */
  private async request<TInput, TOutput>(
    endpoint: string,
    method: HttpMethod,
    path: string,
    body: TInput,
    inputSchema?: ZodLike<TInput>,
    outputSchema?: ZodLike<TOutput>,
  ): Promise<TOutput> {
    // 1. Request validation (synchronous throw before fetch).
    //    `body` is optional for endpoints that take no input
    //    (auth.me/logout/rotateApiKey). When body===undefined we
    //    skip parsing — never feed undefined to Zod, which rejects
    //    it as a missing object.
    let parsedBody: TInput;
    if (inputSchema === undefined || body === undefined) {
      parsedBody = body;
    } else {
      try {
        parsedBody = await inputSchema.parseAsync(body);
      } catch (err) {
        throw new ClientValidationError(
          endpoint,
          "request",
          // Zod's error shape is a discriminated union with .issues.
          // Cast through unknown — we accept ZodError or anything with
          // an `issues` array.
          (err as { issues?: unknown }).issues as never,
        );
      }
    }

    // 2. Build request.
    const headers: Record<string, string> = {};
    if (this.opts.apiKey) {
      headers["X-API-Key"] = this.opts.apiKey;
    } else if (this.opts.sessionCookie) {
      headers["Cookie"] = this.opts.sessionCookie;
    }
    if (method !== "GET" || parsedBody !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const requestBody =
      method === "GET" || parsedBody === undefined
        ? undefined
        : JSON.stringify(parsedBody);

    let response: Response;
    try {
      response = await fetch(`${this.opts.baseUrl}${path}`, {
        method,
        headers,
        body: requestBody,
      });
    } catch (err) {
      throw new NetworkError(
        `Network request failed for ${endpoint}: ${(err as Error).message ?? "unknown"}`,
        err,
      );
    }

    // 3. Parse response body once.
    const contentType = response.headers.get("content-type") ?? "";
    let payload: unknown;
    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    } else {
      payload = await response.text().catch(() => null);
    }

    // 4. Map non-2xx to ApiError (with 401 hint/code).
    if (!response.ok) {
      const code = response.status === 401 ? "API_KEY_REVOKED" : undefined;
      const hint =
        response.status === 401 ? "Try: dt auth rotate-key" : undefined;
      throw new ApiError(response.status, payload, code, hint);
    }

    // 5. Response validation (only when an output schema was provided;
    //    void endpoints like `delete` skip validation).
    if (!outputSchema) {
      return undefined as unknown as TOutput;
    }
    let parsed: TOutput;
    try {
      parsed = await outputSchema.parseAsync(payload);
    } catch (err) {
      throw new ClientValidationError(
        endpoint,
        "response",
        (err as { issues?: unknown }).issues as never,
      );
    }
    return parsed;
  }
}
