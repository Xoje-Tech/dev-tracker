import { describe, it, expect } from "vitest";
import { TaskPriority } from "@tasks/domain/value-objects/task-priority.js";

describe("TaskPriority", () => {
  describe("valid input", () => {
    it("creates priority with 'none'", () => {
      const p = new TaskPriority("none");
      expect(p.value).toBe("none");
    });

    it("creates priority with 'low'", () => {
      const p = new TaskPriority("low");
      expect(p.value).toBe("low");
    });

    it("creates priority with 'medium'", () => {
      const p = new TaskPriority("medium");
      expect(p.value).toBe("medium");
    });

    it("creates priority with 'high'", () => {
      const p = new TaskPriority("high");
      expect(p.value).toBe("high");
    });

    it("creates priority with 'urgent'", () => {
      const p = new TaskPriority("urgent");
      expect(p.value).toBe("urgent");
    });

    it("normalizes to uppercase input to lowercase", () => {
      const p = new TaskPriority("HIGH");
      expect(p.value).toBe("high");
    });

    it("normalizes mixed case input", () => {
      const p = new TaskPriority("Urgent");
      expect(p.value).toBe("urgent");
    });

    it("trims whitespace", () => {
      const p = new TaskPriority("  high  ");
      expect(p.value).toBe("high");
    });

    it("throws on numeric string '0' not in list", () => {
      expect(() => new TaskPriority("0")).toThrow('Invalid priority');
    });
  });

  describe("default values", () => {
    it("defaults to 'none' for null", () => {
      const p = new TaskPriority(null);
      expect(p.value).toBe("none");
    });

    it("defaults to 'none' for undefined", () => {
      const p = new TaskPriority(undefined);
      expect(p.value).toBe("none");
    });

    it("defaults to 'none' for empty string", () => {
      const p = new TaskPriority("");
      expect(p.value).toBe("none");
    });
  });

  describe("invalid input", () => {
    it("throws on invalid string value", () => {
      expect(() => new TaskPriority("critical")).toThrow('Invalid priority');
    });

    it("throws on numeric string not in list", () => {
      expect(() => new TaskPriority("5")).toThrow('Invalid priority');
    });

    it("throws with descriptive error message", () => {
      expect(() => new TaskPriority("super-urgent")).toThrow(
        /Invalid priority.*Must be one of: none, low, medium, high, urgent/,
      );
    });
  });

  describe("static constants", () => {
    it("has NONE constant", () => {
      expect(TaskPriority.NONE).toBe("none");
    });

    it("has LOW constant", () => {
      expect(TaskPriority.LOW).toBe("low");
    });

    it("has MEDIUM constant", () => {
      expect(TaskPriority.MEDIUM).toBe("medium");
    });

    it("has HIGH constant", () => {
      expect(TaskPriority.HIGH).toBe("high");
    });

    it("has URGENT constant", () => {
      expect(TaskPriority.URGENT).toBe("urgent");
    });
  });
});
