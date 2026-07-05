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
});
