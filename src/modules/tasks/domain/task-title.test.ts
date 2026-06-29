import { describe, it, expect } from "vitest";
import { TaskTitle } from "@tasks/domain/value-objects/task-title.js";

describe("TaskTitle", () => {
  describe("valid input", () => {
    it("creates task title with valid value", () => {
      const title = new TaskTitle("Buy groceries");
      expect(title.value).toBe("Buy groceries");
    });

    it("trims whitespace", () => {
      const title = new TaskTitle("  Buy groceries  ");
      expect(title.value).toBe("Buy groceries");
    });

    it("accepts single character title", () => {
      const title = new TaskTitle("X");
      expect(title.value).toBe("X");
    });

    it("accepts title at max boundary (200 chars)", () => {
      const longTitle = "a".repeat(200);
      const title = new TaskTitle(longTitle);
      expect(title.value.length).toBe(200);
    });

    it("accepts titles with special characters", () => {
      const title = new TaskTitle("Fix bug: auth@login (P0) [urgent]");
      expect(title.value).toBe("Fix bug: auth@login (P0) [urgent]");
    });
  });

  describe("invalid input", () => {
    it("throws on empty string", () => {
      expect(() => new TaskTitle("")).toThrow("Task title cannot be empty");
    });

    it("throws on whitespace only", () => {
      expect(() => new TaskTitle("   ")).toThrow("Task title cannot be empty");
    });

    it("throws when title exceeds 200 characters", () => {
      const tooLong = "a".repeat(201);
      expect(() => new TaskTitle(tooLong)).toThrow(
        "Task title cannot exceed 200 characters",
      );
    });
  });
});
