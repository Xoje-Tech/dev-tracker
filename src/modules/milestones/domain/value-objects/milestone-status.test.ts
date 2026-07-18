import { describe, it, expect } from "vitest";
import { MilestoneStatus } from "./milestone-status.js";

describe("MilestoneStatus", () => {
  describe("canonical values", () => {
    it("accepts 'open' as a valid status", () => {
      const status = new MilestoneStatus("open");
      expect(status.value).toBe("open");
    });

    it("accepts 'closed' as a valid status", () => {
      const status = new MilestoneStatus("closed");
      expect(status.value).toBe("closed");
    });

    it("accepts 'archived' as a valid status (soft-delete)", () => {
      const status = new MilestoneStatus("archived");
      expect(status.value).toBe("archived");
    });

    it("treats 'PLANNED' (the Prisma default) as 'open'", () => {
      // The Prisma schema's default is the legacy 'PLANNED' string. Domain
      // treats that as a synonym for 'open' so existing rows hydrate
      // correctly.
      const status = new MilestoneStatus("PLANNED");
      expect(status.value).toBe("open");
    });

    it("normalizes mixed-case 'OPEN' to 'open'", () => {
      const status = new MilestoneStatus("OPEN");
      expect(status.value).toBe("open");
    });
  });

  describe("invalid input", () => {
    it("throws on an unknown status", () => {
      expect(() => new MilestoneStatus("in-progress")).toThrow(
        /Milestone status/,
      );
    });

    it("throws on an empty string", () => {
      expect(() => new MilestoneStatus("")).toThrow(/Milestone status/);
    });
  });

  describe("is helpers", () => {
    it("isOpen() returns true only for 'open'", () => {
      expect(new MilestoneStatus("open").isOpen()).toBe(true);
      expect(new MilestoneStatus("closed").isOpen()).toBe(false);
      expect(new MilestoneStatus("archived").isOpen()).toBe(false);
    });

    it("isClosed() returns true only for 'closed'", () => {
      expect(new MilestoneStatus("closed").isClosed()).toBe(true);
      expect(new MilestoneStatus("open").isClosed()).toBe(false);
      expect(new MilestoneStatus("archived").isClosed()).toBe(false);
    });

    it("isArchived() returns true only for 'archived'", () => {
      expect(new MilestoneStatus("archived").isArchived()).toBe(true);
      expect(new MilestoneStatus("open").isArchived()).toBe(false);
      expect(new MilestoneStatus("closed").isArchived()).toBe(false);
    });
  });
});