import { describe, it, expect } from "vitest";
import { Email, InvalidEmailError } from "@auth/domain/value-objects/email.js";

describe("Email", () => {
  describe("valid input", () => {
    it("creates email with valid format", () => {
      const email = new Email("user@example.com");
      expect(email.value).toBe("user@example.com");
    });

    it("normalizes email to lowercase", () => {
      const email = new Email("User@Example.COM");
      expect(email.value).toBe("user@example.com");
    });

    it("trims whitespace", () => {
      const email = new Email("  user@example.com  ");
      expect(email.value).toBe("user@example.com");
    });

    it("handles email with dots in local part", () => {
      const email = new Email("first.last@example.com");
      expect(email.value).toBe("first.last@example.com");
    });

    it("handles email with plus sign", () => {
      const email = new Email("user+tag@example.com");
      expect(email.value).toBe("user+tag@example.com");
    });

    it("handles subdomain", () => {
      const email = new Email("user@mail.example.com");
      expect(email.value).toBe("user@mail.example.com");
    });
  });

  describe("invalid input", () => {
    it("throws on empty string", () => {
      expect(() => new Email("")).toThrow(InvalidEmailError);
    });

    it("throws on whitespace only", () => {
      expect(() => new Email("   ")).toThrow(InvalidEmailError);
    });

    it("throws on missing @ symbol", () => {
      expect(() => new Email("userexample.com")).toThrow(InvalidEmailError);
    });

    it("throws on missing domain", () => {
      expect(() => new Email("user@")).toThrow(InvalidEmailError);
    });

    it("throws on missing local part", () => {
      expect(() => new Email("@example.com")).toThrow(InvalidEmailError);
    });

    it("throws on missing TLD", () => {
      expect(() => new Email("user@example")).toThrow(InvalidEmailError);
    });

    it("throws on spaces in email", () => {
      expect(() => new Email("user @example.com")).toThrow(InvalidEmailError);
    });

    it("throws on multiple @ symbols", () => {
      expect(() => new Email("user@@example.com")).toThrow(InvalidEmailError);
    });
  });

  describe("equals", () => {
    it("returns true for same email", () => {
      const a = new Email("user@example.com");
      const b = new Email("user@example.com");
      expect(a.equals(b)).toBe(true);
    });

    it("returns true for same email different case", () => {
      const a = new Email("user@example.com");
      const b = new Email("User@Example.COM");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different emails", () => {
      const a = new Email("a@example.com");
      const b = new Email("b@example.com");
      expect(a.equals(b)).toBe(false);
    });
  });
});
