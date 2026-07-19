import { describe, it, expect, vi } from "vitest";
import { schemas, executeTool } from "./tools";
import { McpClient } from "./client";

vi.mock("./client", () => {
  return {
    McpClient: vi.fn().mockImplementation(function() {
      return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      };
    })
  };
});

describe("Tool Schemas", () => {
  it("validates get_project_board schema", () => {
    expect(() => schemas.get_project_board.parse({})).toThrow();
    expect(schemas.get_project_board.parse({ projectId: "123" })).toEqual({ projectId: "123" });
  });

  it("validates create_task schema", () => {
    expect(() => schemas.create_task.parse({ title: "Task" })).toThrow();
    expect(schemas.create_task.parse({
      projectId: "1", title: "Task", description: "desc", columnId: "2"
    })).toEqual({
      projectId: "1", title: "Task", description: "desc", columnId: "2"
    });
  });

  it("validates update_task schema", () => {
    expect(() => schemas.update_task.parse({})).toThrow();
    expect(schemas.update_task.parse({ taskId: "t1", title: "New title" })).toEqual({
      taskId: "t1", title: "New title"
    });
    expect(schemas.update_task.parse({ taskId: "t1", priority: "high" })).toEqual({
      taskId: "t1", priority: "high"
    });
  });

  it("validates delete_task schema", () => {
    expect(() => schemas.delete_task.parse({})).toThrow();
    expect(schemas.delete_task.parse({ taskId: "t1" })).toEqual({ taskId: "t1" });
  });

  // ─────────────── Milestone tool schemas ───────────────

  it("validates list_milestones schema", () => {
    // projectId is required
    expect(() => schemas.list_milestones.parse({})).toThrow();
    expect(
      schemas.list_milestones.parse({ projectId: "p1" }),
    ).toEqual({ projectId: "p1", includeArchived: false });
    // includeArchived is optional but defaults to false; truthy override works
    expect(
      schemas.list_milestones.parse({ projectId: "p1", includeArchived: true }),
    ).toEqual({ projectId: "p1", includeArchived: true });
  });

  it("validates get_milestone schema", () => {
    expect(() => schemas.get_milestone.parse({})).toThrow();
    expect(() => schemas.get_milestone.parse({ projectId: "p1" })).toThrow();
    expect(
      schemas.get_milestone.parse({ projectId: "p1", milestoneId: "m1" }),
    ).toEqual({ projectId: "p1", milestoneId: "m1" });
  });

  it("validates create_milestone schema (title required, others optional)", () => {
    expect(() => schemas.create_milestone.parse({})).toThrow();
    expect(() => schemas.create_milestone.parse({ projectId: "p1" })).toThrow();
    expect(
      schemas.create_milestone.parse({ projectId: "p1", title: "Alpha" }),
    ).toEqual({
      projectId: "p1",
      title: "Alpha",
      description: undefined,
      dueDate: undefined,
    });
    expect(
      schemas.create_milestone.parse({
        projectId: "p1",
        title: "Alpha",
        description: "first release",
        dueDate: "2026-08-01T00:00:00.000Z",
      }),
    ).toEqual({
      projectId: "p1",
      title: "Alpha",
      description: "first release",
      dueDate: "2026-08-01T00:00:00.000Z",
    });
  });

  it("validates update_milestone schema", () => {
    expect(() => schemas.update_milestone.parse({})).toThrow();
    expect(() =>
      schemas.update_milestone.parse({ projectId: "p1" }),
    ).toThrow();
    // milestoneId is required alongside projectId
    expect(
      schemas.update_milestone.parse({
        projectId: "p1",
        milestoneId: "m1",
        title: "Renamed",
      }),
    ).toEqual({
      projectId: "p1",
      milestoneId: "m1",
      title: "Renamed",
      description: undefined,
      dueDate: undefined,
      status: undefined,
    });
    expect(
      schemas.update_milestone.parse({
        projectId: "p1",
        milestoneId: "m1",
        status: "closed",
      }),
    ).toEqual({
      projectId: "p1",
      milestoneId: "m1",
      title: undefined,
      description: undefined,
      dueDate: undefined,
      status: "closed",
    });
  });

  it("validates delete_milestone schema", () => {
    expect(() => schemas.delete_milestone.parse({})).toThrow();
    expect(
      schemas.delete_milestone.parse({ projectId: "p1", milestoneId: "m1" }),
    ).toEqual({ projectId: "p1", milestoneId: "m1" });
  });

  it("validates archive_milestone schema", () => {
    expect(() => schemas.archive_milestone.parse({})).toThrow();
    expect(
      schemas.archive_milestone.parse({ projectId: "p1", milestoneId: "m1" }),
    ).toEqual({ projectId: "p1", milestoneId: "m1" });
  });

  // ─────────────── Sprint tool schemas ───────────────

  it("validates list_sprints schema", () => {
    expect(() => schemas.list_sprints.parse({})).toThrow();
    expect(
      schemas.list_sprints.parse({ projectId: "p1" }),
    ).toEqual({ projectId: "p1" });
  });

  it("validates get_sprint schema", () => {
    expect(() => schemas.get_sprint.parse({})).toThrow();
    expect(() => schemas.get_sprint.parse({ projectId: "p1" })).toThrow();
    expect(
      schemas.get_sprint.parse({ projectId: "p1", sprintId: "s1" }),
    ).toEqual({ projectId: "p1", sprintId: "s1" });
  });

  it("validates create_sprint schema", () => {
    expect(() => schemas.create_sprint.parse({})).toThrow();
    expect(() => schemas.create_sprint.parse({ projectId: "p1" })).toThrow();
    expect(
      schemas.create_sprint.parse({ projectId: "p1", name: "Sprint A" }),
    ).toEqual({
      projectId: "p1",
      name: "Sprint A",
      description: undefined,
      milestoneId: undefined,
    });
    expect(
      schemas.create_sprint.parse({
        projectId: "p1",
        name: "Sprint A",
        description: "first",
        milestoneId: "m1",
      }),
    ).toEqual({
      projectId: "p1",
      name: "Sprint A",
      description: "first",
      milestoneId: "m1",
    });
  });

  it("validates update_sprint schema", () => {
    expect(() => schemas.update_sprint.parse({})).toThrow();
    expect(() => schemas.update_sprint.parse({ projectId: "p1" })).toThrow();
    expect(
      schemas.update_sprint.parse({
        projectId: "p1",
        sprintId: "s1",
        name: "Renamed",
      }),
    ).toEqual({
      projectId: "p1",
      sprintId: "s1",
      name: "Renamed",
      description: undefined,
      milestoneId: undefined,
    });
    // Detach via literal `null` is preserved (zod nullable)
    expect(
      schemas.update_sprint.parse({
        projectId: "p1",
        sprintId: "s1",
        milestoneId: null,
      }),
    ).toEqual({
      projectId: "p1",
      sprintId: "s1",
      name: undefined,
      description: undefined,
      milestoneId: null,
    });
  });

  it("validates delete_sprint schema", () => {
    expect(() => schemas.delete_sprint.parse({})).toThrow();
    expect(
      schemas.delete_sprint.parse({ projectId: "p1", sprintId: "s1" }),
    ).toEqual({ projectId: "p1", sprintId: "s1" });
  });
});

describe("executeTool", () => {
  it("executes list_projects via GET /projects", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.get).mockResolvedValueOnce([{ id: "1" }]);

    const result = await executeTool(mockClient, "list_projects", {});

    expect(mockClient.get).toHaveBeenCalledWith("/projects");
    expect(result.content[0].text).toContain('[{"id":"1"}]');
  });

  it("executes create_task via POST /tasks", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.post).mockResolvedValueOnce({ id: "123" });

    const result = await executeTool(mockClient, "create_task", {
      projectId: "p1", title: "T1", description: "D1", columnId: "c1"
    });

    expect(mockClient.post).toHaveBeenCalledWith("/tasks", {
      projectId: "p1", title: "T1", description: "D1", columnId: "c1"
    });
    expect(result.content[0].text).toContain('{"id":"123"}');
  });

  it("executes move_task via POST /tasks/:id/move with translated body", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.post).mockResolvedValueOnce({ ok: true });

    const result = await executeTool(mockClient, "move_task", {
      taskId: "t1", columnId: "c2"
    });

    // MCP contract exposes { taskId, columnId } but backend expects
    // { targetColumnId, newIndex }. The handler must translate and
    // default newIndex to 0 (append to end of target column).
    expect(mockClient.post).toHaveBeenCalledWith("/tasks/t1/move", {
      targetColumnId: "c2",
      newIndex: 0,
    });
    expect(result.content[0].text).toContain('{"ok":true}');
  });

  it("executes update_task via PATCH /tasks/:id", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.patch).mockResolvedValueOnce({ id: "t1", title: "New title" });

    const result = await executeTool(mockClient, "update_task", {
      taskId: "t1", title: "New title"
    });

    expect(mockClient.patch).toHaveBeenCalledWith("/tasks/t1", { title: "New title" });
    expect(result.content[0].text).toContain('{"id":"t1","title":"New title"}');
  });

  it("executes delete_task via DELETE /tasks/:id", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.delete).mockResolvedValueOnce({ success: true });

    const result = await executeTool(mockClient, "delete_task", { taskId: "t1" });
    expect(mockClient.delete).toHaveBeenCalledWith("/tasks/t1");
    expect(result.content[0].text).toContain('{"success":true}');
  });

  // ─────────────── Milestone tool dispatch ───────────────

  it("executes list_milestones via GET /projects/:projectId/milestones", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.get).mockResolvedValueOnce([{ id: "m1" }]);

    const result = await executeTool(mockClient, "list_milestones", {
      projectId: "p1",
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      "/projects/p1/milestones",
    );
    expect(result.content[0].text).toContain('[{"id":"m1"}]');
  });

  it("executes get_milestone via GET /projects/:projectId/milestones/:milestoneId", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.get).mockResolvedValueOnce({ id: "m1", title: "Alpha" });

    const result = await executeTool(mockClient, "get_milestone", {
      projectId: "p1",
      milestoneId: "m1",
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      "/projects/p1/milestones/m1",
    );
    expect(result.content[0].text).toContain('"id":"m1"');
  });

  it("executes create_milestone via POST /projects/:projectId/milestones", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.post).mockResolvedValueOnce({ id: "m-new" });

    const result = await executeTool(mockClient, "create_milestone", {
      projectId: "p1",
      title: "Alpha",
      description: "first release",
      dueDate: "2026-08-01T00:00:00.000Z",
    });

    expect(mockClient.post).toHaveBeenCalledWith(
      "/projects/p1/milestones",
      {
        title: "Alpha",
        description: "first release",
        dueDate: "2026-08-01T00:00:00.000Z",
      },
    );
    expect(result.content[0].text).toContain('{"id":"m-new"}');
  });

  it("executes update_milestone via PATCH /projects/:projectId/milestones/:milestoneId", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.patch).mockResolvedValueOnce({ id: "m1", status: "closed" });

    const result = await executeTool(mockClient, "update_milestone", {
      projectId: "p1",
      milestoneId: "m1",
      status: "closed",
    });

    expect(mockClient.patch).toHaveBeenCalledWith(
      "/projects/p1/milestones/m1",
      { status: "closed" },
    );
    expect(result.content[0].text).toContain('"status":"closed"');
  });

  it("executes delete_milestone via DELETE /projects/:projectId/milestones/:milestoneId", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.delete).mockResolvedValueOnce({ success: true });

    const result = await executeTool(mockClient, "delete_milestone", {
      projectId: "p1",
      milestoneId: "m1",
    });

    expect(mockClient.delete).toHaveBeenCalledWith(
      "/projects/p1/milestones/m1",
    );
    expect(result.content[0].text).toContain('{"success":true}');
  });

  it("executes archive_milestone via POST /projects/:projectId/milestones/:milestoneId/archive", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.post).mockResolvedValueOnce({ id: "m1", status: "archived" });

    const result = await executeTool(mockClient, "archive_milestone", {
      projectId: "p1",
      milestoneId: "m1",
    });

    expect(mockClient.post).toHaveBeenCalledWith(
      "/projects/p1/milestones/m1/archive",
      {},
    );
    expect(result.content[0].text).toContain('"status":"archived"');
  });

  // ─────────────── Sprint tool dispatch ───────────────

  it("executes list_sprints via GET /projects/:projectId/sprints", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.get).mockResolvedValueOnce([{ id: "s1" }]);

    const result = await executeTool(mockClient, "list_sprints", {
      projectId: "p1",
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      "/projects/p1/sprints",
    );
    expect(result.content[0].text).toContain('[{"id":"s1"}]');
  });

  it("executes get_sprint via GET /projects/:projectId/sprints/:sprintId", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.get).mockResolvedValueOnce({ id: "s1", name: "Sprint A" });

    const result = await executeTool(mockClient, "get_sprint", {
      projectId: "p1",
      sprintId: "s1",
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      "/projects/p1/sprints/s1",
    );
    expect(result.content[0].text).toContain('"name":"Sprint A"');
  });

  it("executes create_sprint via POST /projects/:projectId/sprints", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.post).mockResolvedValueOnce({ id: "s-new" });

    const result = await executeTool(mockClient, "create_sprint", {
      projectId: "p1",
      name: "Sprint A",
      description: "first sprint",
      milestoneId: "m1",
    });

    expect(mockClient.post).toHaveBeenCalledWith(
      "/projects/p1/sprints",
      {
        name: "Sprint A",
        description: "first sprint",
        milestoneId: "m1",
      },
    );
    expect(result.content[0].text).toContain('{"id":"s-new"}');
  });

  it("executes update_sprint via PATCH /projects/:projectId/sprints/:sprintId", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.patch).mockResolvedValueOnce({ id: "s1", name: "Renamed" });

    const result = await executeTool(mockClient, "update_sprint", {
      projectId: "p1",
      sprintId: "s1",
      name: "Renamed",
    });

    expect(mockClient.patch).toHaveBeenCalledWith(
      "/projects/p1/sprints/s1",
      { name: "Renamed" },
    );
    expect(result.content[0].text).toContain('"name":"Renamed"');
  });

  it("executes update_sprint detach (milestoneId=null) without dropping the null", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.patch).mockResolvedValueOnce({ id: "s1", milestoneId: null });

    await executeTool(mockClient, "update_sprint", {
      projectId: "p1",
      sprintId: "s1",
      milestoneId: null,
    });

    // detach must preserve the explicit `null` so the backend clears the FK
    expect(mockClient.patch).toHaveBeenCalledWith(
      "/projects/p1/sprints/s1",
      { milestoneId: null },
    );
  });

  it("executes delete_sprint via DELETE /projects/:projectId/sprints/:sprintId", async () => {
    const mockClient = new McpClient("url", "key");
    vi.mocked(mockClient.delete).mockResolvedValueOnce({ success: true });

    const result = await executeTool(mockClient, "delete_sprint", {
      projectId: "p1",
      sprintId: "s1",
    });

    expect(mockClient.delete).toHaveBeenCalledWith(
      "/projects/p1/sprints/s1",
    );
    expect(result.content[0].text).toContain('{"success":true}');
  });
});