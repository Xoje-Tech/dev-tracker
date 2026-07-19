import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useMilestonesStore } from "./milestones";
import type { Milestone } from "@client/milestones/domain/types";

const sample: Milestone = {
  id: "mil-1",
  projectId: "proj-1",
  title: "Alpha",
  description: "first release",
  dueDate: "2026-08-01T00:00:00.000Z",
  status: "open",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
};

function mockFetchOk(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(""),
  });
}

function mockFetchError(status: number, body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(""),
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
});

describe("useMilestonesStore — fetchAll", () => {
  it("fetches the project milestones and stores them", async () => {
    const fetchSpy = mockFetchOk([sample]);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    const result = await store.fetchAll("proj-1");

    expect(result).toEqual([sample]);
    expect(store.milestones).toEqual([sample]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain("/api/projects/proj-1/milestones");
  });

  it("appends ?includeArchived=true when requested", async () => {
    const fetchSpy = mockFetchOk([]);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    await store.fetchAll("proj-1", { includeArchived: true });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("includeArchived=true");
  });

  it("returns null and sets error on non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchError(403, { message: "Not a project member" }),
    );

    const store = useMilestonesStore();
    const result = await store.fetchAll("proj-1");

    expect(result).toBeNull();
    expect(store.error).toContain("Not a project member");
    expect(store.milestones).toEqual([]);
  });
});

describe("useMilestonesStore — fetchOne", () => {
  it("fetches a milestone and prepends when missing from list", async () => {
    const fetchSpy = mockFetchOk(sample);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    const result = await store.fetchOne("proj-1", "mil-1");

    expect(result).toEqual(sample);
    expect(store.milestones[0]).toEqual(sample);
  });

  it("replaces the milestone in-place when already in list", async () => {
    const updated = { ...sample, title: "Renamed" };
    const fetchSpy = mockFetchOk(updated);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    store.milestones = [sample];
    await store.fetchOne("proj-1", "mil-1");

    expect(store.milestones).toEqual([updated]);
  });
});

describe("useMilestonesStore — create", () => {
  it("POSTs to collection and prepends the created milestone", async () => {
    const created = { ...sample, id: "mil-new" };
    const fetchSpy = mockFetchOk(created);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    const result = await store.create("proj-1", { title: "Alpha" });

    expect(result).toEqual(created);
    expect(store.milestones[0]).toEqual(created);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/api/projects/proj-1/milestones");
    expect((init as RequestInit).method).toBe("POST");
  });
});

describe("useMilestonesStore — update", () => {
  it("PATCHes and replaces in-place", async () => {
    const updated = { ...sample, title: "Renamed" };
    const fetchSpy = mockFetchOk(updated);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    store.milestones = [sample];
    const result = await store.update("proj-1", "mil-1", { title: "Renamed" });

    expect(result).toEqual(updated);
    expect(store.milestones[0]).toEqual(updated);
  });

  it("rolls back optimistic update on failure", async () => {
    const fetchSpy = mockFetchError(409, {
      message: "Illegal status transition",
    });
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    store.milestones = [sample];
    await expect(
      store.update("proj-1", "mil-1", { status: "open" }),
    ).rejects.toThrow();

    expect(store.milestones[0]).toEqual(sample); // rolled back to original
  });
});

describe("useMilestonesStore — archive", () => {
  it("POSTs to /:id/archive and updates status", async () => {
    const archived = { ...sample, status: "archived" as const };
    const fetchSpy = mockFetchOk(archived);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    store.milestones = [sample];
    const result = await store.archive("proj-1", "mil-1");

    expect(result.status).toBe("archived");
    expect(store.milestones[0].status).toBe("archived");
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/api/projects/proj-1/milestones/mil-1/archive");
  });
});

describe("useMilestonesStore — remove", () => {
  it("DELETEs and removes from list", async () => {
    const fetchSpy = mockFetchOk({});
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    store.milestones = [sample];
    await store.remove("proj-1", "mil-1");

    expect(store.milestones).toEqual([]);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/api/projects/proj-1/milestones/mil-1");
    expect((init as RequestInit).method).toBe("DELETE");
  });

  it("rolls back on failure", async () => {
    const fetchSpy = mockFetchError(404, { message: "Unknown" });
    vi.stubGlobal("fetch", fetchSpy);

    const store = useMilestonesStore();
    store.milestones = [sample];
    await expect(store.remove("proj-1", "mil-1")).rejects.toThrow();

    expect(store.milestones).toEqual([sample]);
  });
});

describe("useMilestonesStore — reset", () => {
  it("clears all state", () => {
    const store = useMilestonesStore();
    store.milestones = [sample];
    store.loading = true;
    store.error = "boom";
    store.reset();

    expect(store.milestones).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});