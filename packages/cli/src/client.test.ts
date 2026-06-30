import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError, isAuthError } from "./client.js";
import * as sessionMod from "./session.js";
import { mockFetch } from "../test-helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiClient — auth errors", () => {
  it("attaches hint + code on 401 and appends hint to the message", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "stale-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([
      { status: 401, body: { message: "Invalid API key" } },
    ]);

    const api = new ApiClient("http://example.test");
    await expect(api.get("/api/auth/me")).rejects.toMatchObject({
      status: 401,
      code: "API_KEY_REVOKED",
      hint: "Try: dt auth rotate-key",
      message: expect.stringContaining("Try: dt auth rotate-key"),
    });

    // Exercise the type guard on a separately-queued 401 response
    // (the previous await already consumed the first one).
    enqueue([{ status: 401, body: { message: "Invalid API key" } }]);
    try {
      await api.get("/api/auth/me");
    } catch (err) {
      expect(isAuthError(err)).toBe(true);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("API_KEY_REVOKED");
      expect(apiErr.message).toMatch(/\(Try: dt auth rotate-key\)$/);
    }
  });

  it("preserves original message + adds no hint/code on non-401 errors", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
    });
    const { enqueue } = mockFetch();
    enqueue([{ status: 404, body: { message: "Project not found" } }]);

    const api = new ApiClient("http://example.test");
    let caught: unknown;
    try {
      await api.get("/api/projects/missing");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as ApiError).status).toBe(404);
    expect((caught as ApiError).message).toBe("Project not found");
    expect((caught as ApiError).code).toBeUndefined();
    expect((caught as ApiError).hint).toBeUndefined();
    expect(isAuthError(caught)).toBe(false);
  });

  it("isAuthError returns false for non-ApiErrors", () => {
    expect(isAuthError(new Error("boom"))).toBe(false);
    expect(isAuthError({ status: 401 })).toBe(false);
    expect(isAuthError(null)).toBe(false);
    expect(isAuthError("not even an object")).toBe(false);
  });

  it("falls back to body.error when body.message is missing on 401", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
    });
    const { enqueue } = mockFetch();
    enqueue([{ status: 401, body: { error: "Unauthorized" } }]);

    const api = new ApiClient("http://example.test");
    await expect(api.get("/api/auth/me")).rejects.toMatchObject({
      status: 401,
      code: "API_KEY_REVOKED",
      message: "Unauthorized (Try: dt auth rotate-key)",
    });
  });
});
