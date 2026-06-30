/**
 * HttpDevTrackerClient unit tests.
 *
 * Covers:
 *  - happy path for one call per module (5 tests)
 *  - request shape (URL/method/headers/body)
 *  - Zod rejection of bad input (sync throw, no fetch called)
 *  - Zod rejection of bad response (after fetch)
 *  - 401 -> ApiError with hint
 *  - 4xx -> ApiError without hint
 *  - network error -> NetworkError
 *  - auth priority: apiKey -> X-API-Key; cookie -> Cookie
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpDevTrackerClient } from "../http.js";
import { ApiError, ClientValidationError, NetworkError } from "../errors.js";
import { mockFetch } from "../../../../cli/test-helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Convenience: a client with apiKey auth, returns the spy + enqueue. */
function authedClient(opts?: { apiKey?: string; cookie?: string }) {
  const client = new HttpDevTrackerClient({
    baseUrl: "http://api.test",
    apiKey: opts?.apiKey,
    sessionCookie: opts?.cookie,
  });
  const { enqueue, spy } = mockFetch();
  return { client, enqueue, spy };
}

describe("HttpDevTrackerClient — happy path per module", () => {
  it("auth.register POSTs and returns parsed user", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([
      {
        status: 200,
        body: {
          id: "u1",
          email: "a@b.test",
          name: "A",
          apiKey: "k1",
        },
      },
    ]);
    const user = await client.auth.register({
      email: "a@b.test",
      name: "A",
      password: "secret123",
    });
    expect(user).toEqual({
      id: "u1",
      email: "a@b.test",
      name: "A",
      apiKey: "k1",
    });
  });

  it("projects.create POSTs and returns parsed project", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([
      {
        status: 201,
        body: {
          id: "p1",
          name: "My Project",
          description: null,
          archived: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          role: "owner",
        },
      },
    ]);
    const p = await client.projects.create({ name: "My Project" });
    expect(p.id).toBe("p1");
    expect(p.name).toBe("My Project");
  });

  it("boards.createDefault POSTs and returns parsed board", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([
      {
        status: 201,
        body: {
          id: "b1",
          projectId: "p1",
          columns: [],
        },
      },
    ]);
    const b = await client.boards.createDefault({ projectId: "p1" });
    expect(b.id).toBe("b1");
    expect(b.columns).toEqual([]);
  });

  it("tasks.create POSTs and returns parsed task", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([
      {
        status: 201,
        body: {
          id: "t1",
          columnId: "c1",
          title: "Task",
          description: null,
          priority: "medium",
          order: 0,
          assigneeId: null,
          creatorId: "u1",
          tagIds: [],
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      },
    ]);
    const t = await client.tasks.create({
      columnId: "c1",
      title: "Task",
      order: 0,
    });
    expect(t.id).toBe("t1");
    expect(t.title).toBe("Task");
  });

  it("tags.create POSTs and returns parsed tag", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([
      { status: 201, body: { id: "tag1", name: "bug", color: "#ff0000" } },
    ]);
    const tag = await client.tags.create({ name: "bug", color: "#ff0000" });
    expect(tag).toEqual({ id: "tag1", name: "bug", color: "#ff0000" });
  });
});

describe("HttpDevTrackerClient — request shape", () => {
  it("uses POST + URL + body + X-API-Key header when apiKey set", async () => {
    const { client, enqueue, spy } = authedClient({ apiKey: "mykey" });
    enqueue([
      {
        status: 201,
        body: { id: "u1", email: "a@b.test", name: "A", apiKey: "mykey" },
      },
    ]);
    await client.auth.register({
      email: "a@b.test",
      name: "A",
      password: "secret123",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy!.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/auth/register");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("mykey");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "a@b.test",
      name: "A",
      password: "secret123",
    });
  });

  it("uses Cookie header when apiKey absent and sessionCookie set", async () => {
    const { client, enqueue, spy } = authedClient({
      cookie: "sid=abc; token=xyz",
    });
    enqueue([
      { status: 200, body: { id: "u1", email: "a@b.test", name: "A", apiKey: "k1" } },
    ]);
    await client.auth.me();
    const [, init] = spy!.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Cookie"]).toBe("sid=abc; token=xyz");
    expect(headers["X-API-Key"]).toBeUndefined();
  });

  it("encodes path params via encodeURIComponent", async () => {
    const { client, enqueue, spy } = authedClient({ apiKey: "k1" });
    enqueue([
      {
        status: 200,
        body: {
          id: "p 1",
          name: "X",
          description: null,
          archived: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          role: "owner",
        },
      },
    ]);
    await client.projects.get({ id: "p 1" });
    const [url] = spy!.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/projects/p%201");
  });

  it("apiKey takes priority over sessionCookie", async () => {
    const { client, enqueue, spy } = authedClient({
      apiKey: "key-A",
      cookie: "sid=should-not-show",
    });
    enqueue([
      { status: 200, body: { id: "u1", email: "a@b.test", name: "A", apiKey: "key-A" } },
    ]);
    await client.auth.me();
    const [, init] = spy!.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("key-A");
    expect(headers["Cookie"]).toBeUndefined();
  });
});

describe("HttpDevTrackerClient — Zod validation", () => {
  it("throws ClientValidationError on bad input, BEFORE fetch is called", async () => {
    const { client, enqueue, spy } = authedClient({ apiKey: "k1" });
    // empty queue — fetch MUST not be called
    await expect(
      client.auth.register({
        email: "not-an-email",
        name: "",
        password: "x",
      }),
    ).rejects.toBeInstanceOf(ClientValidationError);
    expect(spy).not.toHaveBeenCalled();
    expect(enqueue).toBeDefined();
  });

  it("throws ClientValidationError on bad response body", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    // userOutputSchema requires {id,email,name,apiKey} — missing name.
    enqueue([
      { status: 200, body: { id: "u1", email: "a@b.test", apiKey: "k1" } },
    ]);
    await expect(
      client.auth.register({
        email: "a@b.test",
        name: "A",
        password: "secret123",
      }),
    ).rejects.toBeInstanceOf(ClientValidationError);
  });

  it("ClientValidationError has direction='request' on bad input", async () => {
    const { client } = authedClient();
    try {
      await client.auth.register({
        email: "not-an-email",
        name: "A",
        password: "secret123",
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ClientValidationError);
      expect((err as ClientValidationError).direction).toBe("request");
      expect((err as ClientValidationError).endpoint).toBe("auth.register");
    }
  });
});

describe("HttpDevTrackerClient — error mapping", () => {
  it("401 -> ApiError with API_KEY_REVOKED hint", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([{ status: 401, body: { message: "Invalid API key" } }]);
    try {
      await client.auth.me();
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.code).toBe("API_KEY_REVOKED");
      expect(apiErr.hint).toBe("Try: dt auth rotate-key");
      expect(apiErr.message).toContain("Try: dt auth rotate-key");
    }
  });

  it("404 -> ApiError without hint", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([{ status: 404, body: { message: "Not found" } }]);
    try {
      await client.projects.get({ id: "missing" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.code).toBeUndefined();
      expect(apiErr.hint).toBeUndefined();
    }
  });

  it("500 -> ApiError with status only", async () => {
    const { client, enqueue } = authedClient({ apiKey: "k1" });
    enqueue([{ status: 500, body: { message: "boom" } }]);
    await expect(client.projects.get({ id: "x" })).rejects.toMatchObject({
      status: 500,
    });
  });

  it("network failure -> NetworkError", async () => {
    // mockFetch throws when queue is empty — simulate transport failure.
    const client = new HttpDevTrackerClient({
      baseUrl: "http://api.test",
      apiKey: "k1",
    });
    const { enqueue } = mockFetch();
    // Enqueue nothing — the next fetch will throw.
    enqueue([]);
    await expect(
      client.auth.register({
        email: "a@b.test",
        name: "A",
        password: "secret123",
      }),
    ).rejects.toBeInstanceOf(NetworkError);
  });
});
