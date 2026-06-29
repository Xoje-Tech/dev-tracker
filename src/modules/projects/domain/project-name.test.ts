import { describe, it, expect } from "vitest";
import { ProjectName } from "@projects/domain/value-objects/project-name.js";

describe("ProjectName", () => {
  describe("valid input", () => {
    it("creates project name with valid value", () => {
      const name = new ProjectName("My Project");
      expect(name.value).toBe("My Project");
    });

    it("trims whitespace", () => {
      const name = new ProjectName("  My Project  ");
      expect(name.value).toBe("My Project");
    });

    it("accepts single character name", () => {
      const name = new ProjectName("A");
      expect(name.value).toBe("A");
    });

    it("accepts name at max boundary (100 chars)", () => {
      const longName = "a".repeat(100);
      const name = new ProjectName(longName);
      expect(name.value.length).toBe(100);
    });

    it("accepts names with special characters", () => {
      const name = new ProjectName("My App (v2.0) — Production!");
      expect(name.value).toBe("My App (v2.0) — Production!");
    });
  });

  describe("invalid input", () => {
    it("throws on empty string", () => {
      expect(() => new ProjectName("")).toThrow("Project name cannot be empty");
    });

    it("throws on whitespace only", () => {
      expect(() => new ProjectName("   ")).toThrow("Project name cannot be empty");
    });

    it("throws when name exceeds 100 characters", () => {
      const tooLong = "a".repeat(101);
      expect(() => new ProjectName(tooLong)).toThrow(
        "Project name cannot exceed 100 characters",
      );
    });
  });
});
