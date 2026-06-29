import { describe, it, expect } from "vitest";
import { TagName } from "@tags/domain/value-objects/tag-name.js";

describe("TagName", () => {
  describe("valid input", () => {
    it("creates tag name with valid value", () => {
      const tag = new TagName("frontend");
      expect(tag.value).toBe("frontend");
    });

    it("trims whitespace", () => {
      const tag = new TagName("  frontend  ");
      expect(tag.value).toBe("frontend");
    });

    it("normalizes to lowercase", () => {
      const tag = new TagName("FRONTEND");
      expect(tag.value).toBe("frontend");
    });

    it("normalizes mixed case", () => {
      const tag = new TagName("BugFix");
      expect(tag.value).toBe("bugfix");
    });

    it("accepts single character tag", () => {
      const tag = new TagName("x");
      expect(tag.value).toBe("x");
    });

    it("accepts tag at max boundary (50 chars)", () => {
      const longTag = "a".repeat(50);
      const tag = new TagName(longTag);
      expect(tag.value.length).toBe(50);
    });
  });

  describe("invalid input", () => {
    it("throws on empty string", () => {
      expect(() => new TagName("")).toThrow("Tag name cannot be empty");
    });

    it("throws on whitespace only", () => {
      expect(() => new TagName("   ")).toThrow("Tag name cannot be empty");
    });

    it("throws when tag exceeds 50 characters", () => {
      const tooLong = "a".repeat(51);
      expect(() => new TagName(tooLong)).toThrow(
        "Tag name cannot exceed 50 characters",
      );
    });
  });
});
