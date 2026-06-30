import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { persistUserWithApiKey } from "./auth.js";
import * as sessionMod from "../session.js";
import { mockFetch } from "../../test-helpers.js";

// We'll patch the internal ApiClient via mocking fetch + session, which is
// enough to drive persistUserWithApiKey through both happy and failure paths.

let program: Command;

beforeEach(() => {
  vi.restoreAllMocks();
  program = new Command();
  program.option("-u, --url <url>", "API base URL", "http://example.test");
  program.parse(["node", "test", "-u", "http://example.test"], { from: "node" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const baseUser = {
  id: "u-1",
  email: "alice@example.test",
  name: "Alice",
  apiKey: null,
};

describe("persistUserWithApiKey — rotate failure handling", () => {
  it("emits a stderr warning when rotate-api-key 500s but doesn't fail the login", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      cookieHeader: "sid=abc",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    // persistUserWithApiKey makes ONE outbound call: /api/auth/rotate-api-key.
    enqueue([{ status: 500, body: { message: "Internal Server Error" } }]);

    const stderrSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await persistUserWithApiKey(program, baseUser);

    // Login flow still succeeds; user is recorded with cookie-only auth.
    expect(result.user).toEqual(baseUser);
    expect(result.apiKey).toBeNull();
    expect(stderrSpy).toHaveBeenCalled();
    const warnLine = stderrSpy.mock.calls
      .map((c) => String(c[0] ?? ""))
      .join(" ");
    expect(warnLine).toContain("[warn]");
    expect(warnLine).toContain("Could not rotate API key after login");
    expect(warnLine).toContain("dt auth rotate-key");
  });

  it("succeeds and stays silent when rotate-api-key returns an apiKey", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      cookieHeader: "sid=abc",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { apiKey: "rot-123" } }]);

    const stderrSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await persistUserWithApiKey(program, baseUser);

    expect(result.apiKey).toBe("rot-123");
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("skips the rotate call entirely when the user already has an apiKey", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const fetchSpy = mockFetch().spy as unknown as ReturnType<typeof vi.fn>;
    const stderrSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await persistUserWithApiKey(program, {
      ...baseUser,
      apiKey: "baked-in",
    });

    expect(result.apiKey).toBe("baked-in");
    expect(fetchSpy?.mock.calls.length ?? 0).toBe(0);
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});
