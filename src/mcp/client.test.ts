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
    const mockFetch = vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }));
    const client = new McpClient("http://localhost:3000/api", "test-key");

    await expect(client.get("/projects")).rejects.toThrow("Not Found");
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
});
