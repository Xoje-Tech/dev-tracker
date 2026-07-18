import { describe, it, expect } from "vitest";
import { MilestoneTitle } from "./milestone-title.js";

describe("MilestoneTitle", () => {
  describe("valid input", () => {
    it("creates a milestone title with a valid value", () => {
      const title = new MilestoneTitle("v1.0 Launch");
      expect(title.value).toBe("v1.0 Launch");
    });

    it("trims surrounding whitespace", () => {
      const title = new MilestoneTitle("  v1.0 Launch  ");
      expect(title.value).toBe("v1.0 Launch");
    });

    it("accepts a single character title", () => {
      const title = new MilestoneTitle("X");
      expect(title.value).toBe("X");
    });

    it("accepts a title at the max boundary (120 chars)", () => {
      const long = "a".repeat(120);
      const title = new MilestoneTitle(long);
      expect(title.value.length).toBe(120);
    });

    it("accepts titles with special characters", () => {
      const title = new MilestoneTitle("v1.0 (GA) — production!");
      expect(title.value).toBe("v1.0 (GA) — production!");
    });
  });

  describe("invalid input", () => {
    it("throws on empty string", () => {
      expect(() => new MilestoneTitle("")).toThrow(/Milestone title/);
    });

    it("throws on whitespace-only string", () => {
      expect(() => new MilestoneTitle("   ")).toThrow(/Milestone title/);
    });

    it("throws when title exceeds 120 characters", () => {
      const tooLong = "a".repeat(121);
      expect(() => new MilestoneTitle(tooLong)).toThrow(
        /Milestone title/,
      );
    });
  });
});