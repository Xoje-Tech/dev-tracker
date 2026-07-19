import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpClient } from "./client";

describe("McpClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("adds API key header to requests", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue(new Response("[]"));
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await client.get("/projects");

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000/api/projects", expect.objectContaining({
      headers: {
        "x-api-key": "test-key",
        "Content-Type": "application/json"
      }
    }));
  });

  it("throws formatted error on non-2xx responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }));
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await expect(client.get("/projects")).rejects.toThrow("Not Found");
  });

  it("throws descriptive error with details on validation failures", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      error: "Validation failed",
      details: {
        title: ["Required"],
        columnId: ["Invalid ID"]
      }
    }), { status: 400 }));
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await expect(client.get("/projects")).rejects.toThrow(
      "Validation failed:\ntitle: Required\ncolumnId: Invalid ID"
    );
  });
  
  it("sends POST payload correctly", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: "1" })));
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await client.post("/projects", { name: "Test" });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000/api/projects", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Test" })
    }));
  });

  // Phase 2: McpClient transport verification for PATCH and DELETE.
  // These methods already exist at src/mcp/client.ts:47-58. The tests
  // below pin their wire-level contract (URL, headers, method, body
  // encoding) and error-parse behaviour so any regression is caught.
  // No source edits — only verification coverage.

  it("sends PATCH with JSON body and merged headers", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "p1", title: "patched" })),
    );
    const client = new McpClient("http://localhost:3000/api", "test-key");

    const result = await client.patch("/projects/p1", { title: "patched" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/projects/p1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "patched" }),
        headers: expect.objectContaining({
          "x-api-key": "test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual({ id: "p1", title: "patched" });
  });

  it("throws formatted error on PATCH non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }),
    );
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await expect(
      client.patch("/projects/missing", { title: "x" }),
    ).rejects.toThrow("Not Found");
  });

  it("sends DELETE as bodyless request with the API key header", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true })),
    );
    const client = new McpClient("http://localhost:3000/api", "test-key");

    const result = await client.delete("/projects/p1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/projects/p1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "x-api-key": "test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
    // The wire-level contract pins that DELETE is bodyless: there must
    // be no JSON body. Express + the API will reject DELETE bodies on
    // most routes, so omitting the body here is intentional.
    const callArgs = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(callArgs?.body).toBeUndefined();
    expect(result).toEqual({ success: true });
  });

  it("throws formatted error on DELETE non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    );
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await expect(client.delete("/projects/p1")).rejects.toThrow("Forbidden");
  });
});
