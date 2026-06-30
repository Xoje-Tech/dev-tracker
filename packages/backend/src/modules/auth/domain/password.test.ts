import { describe, it, expect } from "vitest";
import { Password } from "@auth/domain/value-objects/password.js";

describe("Password", () => {
  describe("create", () => {
    it("creates password with valid plain text", async () => {
      const password = await Password.create("securepassword123");
      expect(password.hash).toBeDefined();
      expect(password.hash.length).toBeGreaterThan(0);
    });

    it("hashes differ for same plaintext (different salts)", async () => {
      const a = await Password.create("securepassword123");
      const b = await Password.create("securepassword123");
      expect(a.hash).not.toBe(b.hash);
    });

    it("hashes start with bcrypt prefix", async () => {
      const password = await Password.create("securepassword123");
      expect(password.hash).toMatch(/^\$2[aby]\$/);
    });

    it("throws on password too short (7 chars)", async () => {
      await expect(Password.create("short7!")).rejects.toThrow(
        "Password must be at least 8 characters",
      );
    });

    it("creates password with exactly 8 characters", async () => {
      const password = await Password.create("12345678");
      expect(password.hash).toBeDefined();
    });

    it("accepts long passwords", async () => {
      const longPassword = "a".repeat(128);
      const password = await Password.create(longPassword);
      expect(password.hash).toBeDefined();
    });
  });

  describe("fromHash", () => {
    it("creates password from existing hash", () => {
      const hash = "$2a$10$somehashvalue";
      const password = Password.fromHash(hash);
      expect(password.hash).toBe(hash);
    });
  });

  describe("compare", () => {
    it("returns true for correct password", async () => {
      const password = await Password.create("mypassword123");
      expect(await password.compare("mypassword123")).toBe(true);
    });

    it("returns false for wrong password", async () => {
      const password = await Password.create("mypassword123");
      expect(await password.compare("wrongpassword")).toBe(false);
    });

    it("returns false for empty string", async () => {
      const password = await Password.create("mypassword123");
      expect(await password.compare("")).toBe(false);
    });

    it("returns true when comparing correct password from hash", async () => {
      const original = await Password.create("testpass123");
      const fromHash = Password.fromHash(original.hash);
      expect(await fromHash.compare("testpass123")).toBe(true);
    });
  });
});
