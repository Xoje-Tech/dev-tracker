import { describe, it, expect } from "vitest";
import { createTaskDtoSchema } from "./create-task-dto.js";

describe("CreateTaskDto", () => {
  it("accepts the minimal MCP contract (columnId, title, columnId)", () => {
    // This mirrors exactly what the MCP create_task tool sends. order is
    // intentionally absent — the use case computes it server-side.
    const minimal = {
      projectId: "p1",
      columnId: "c1",
      title: "T1",
      description: "d",
    };
    const result = createTaskDtoSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects when columnId is missing", () => {
    const result = createTaskDtoSchema.safeParse({ title: "T1" });
    expect(result.success).toBe(false);
  });

  it("rejects when title is missing", () => {
    const result = createTaskDtoSchema.safeParse({ columnId: "c1" });
    expect(result.success).toBe(false);
  });

  it("defaults priority to medium when omitted", () => {
    const parsed = createTaskDtoSchema.parse({ columnId: "c1", title: "T1" });
    expect(parsed.priority).toBe("medium");
  });

  it("accepts an explicit order (backwards-compatible with HTTP clients)", () => {
    const parsed = createTaskDtoSchema.parse({
      columnId: "c1",
      title: "T1",
      order: 5,
    });
    expect(parsed.order).toBe(5);
  });

  it("rejects a negative order", () => {
    const result = createTaskDtoSchema.safeParse({
      columnId: "c1",
      title: "T1",
      order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer order", () => {
    const result = createTaskDtoSchema.safeParse({
      columnId: "c1",
      title: "T1",
      order: 1.5,
    });
    expect(result.success).toBe(false);
  });
});
