import { describe, it, expect } from "vitest";
import { User } from "@auth/domain/entities/user.js";
import { Email } from "@auth/domain/value-objects/email.js";
import { Password } from "@auth/domain/value-objects/password.js";
import { ApiKey } from "@auth/domain/value-objects/api-key.js";

describe("User", () => {
  describe("create", () => {
    it("creates user with email, name, and password", async () => {
      const email = new Email("user@example.com");
      const password = await Password.create("password123");
      const user = User.create({
        id: "user-1",
        email,
        name: "Test User",
        password,
      });

      expect(user.id).toBe("user-1");
      expect(user.email).toBe(email);
      expect(user.name).toBe("Test User");
      expect(user.passwordHash).toBe(password.hash);
      expect(user.apiKey).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("withApiKey", () => {
    it("returns new user with API key", async () => {
      const email = new Email("user@example.com");
      const password = await Password.create("password123");
      const original = User.create({
        id: "user-1",
        email,
        name: "Test User",
        password,
      });

      const apiKey = ApiKey.generate();
      const updated = original.withApiKey(apiKey);

      expect(updated.id).toBe(original.id);
      expect(updated.email).toBe(original.email);
      expect(updated.name).toBe(original.name);
      expect(updated.passwordHash).toBe(original.passwordHash);
      expect(updated.apiKey).toBe(apiKey.value);
      expect(updated.createdAt).toBe(original.createdAt);
      expect(updated.updatedAt).toBe(original.updatedAt);
    });

    it("original user is unchanged (immutable)", async () => {
      const email = new Email("user@example.com");
      const password = await Password.create("password123");
      const original = User.create({
        id: "user-1",
        email,
        name: "Test User",
        password,
      });

      const apiKey = ApiKey.generate();
      original.withApiKey(apiKey);

      expect(original.apiKey).toBeNull();
    });
  });
});
