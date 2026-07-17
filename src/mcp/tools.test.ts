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
});
