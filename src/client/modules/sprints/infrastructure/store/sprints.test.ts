import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSprintsStore } from "./sprints";
import type { Sprint } from "@client/sprints/domain/types";

const sample: Sprint = {
  id: "sprint-1",
  projectId: "proj-1",
  name: "Sprint A",
  description: "first sprint",
  milestoneId: null,
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

describe("useSprintsStore — fetchAll", () => {
  it("fetches the project sprints and stores them", async () => {
    const fetchSpy = mockFetchOk([sample]);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    const result = await store.fetchAll("proj-1");

    expect(result).toEqual([sample]);
    expect(store.sprints).toEqual([sample]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/api/projects/proj-1/sprints");
  });

  it("returns null and sets error on non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchError(403, { message: "Not a project member" }),
    );

    const store = useSprintsStore();
    const result = await store.fetchAll("proj-1");

    expect(result).toBeNull();
    expect(store.error).toContain("Not a project member");
  });
});

describe("useSprintsStore — fetchOne", () => {
  it("fetches a sprint and prepends when missing from list", async () => {
    const fetchSpy = mockFetchOk(sample);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    const result = await store.fetchOne("proj-1", "sprint-1");

    expect(result).toEqual(sample);
    expect(store.sprints[0]).toEqual(sample);
  });

  it("replaces the sprint in-place when already in list", async () => {
    const updated = { ...sample, name: "Renamed" };
    const fetchSpy = mockFetchOk(updated);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    store.sprints = [sample];
    await store.fetchOne("proj-1", "sprint-1");

    expect(store.sprints).toEqual([updated]);
  });
});

describe("useSprintsStore — create", () => {
  it("POSTs to collection and prepends the created sprint", async () => {
    const created = { ...sample, id: "sprint-new" };
    const fetchSpy = mockFetchOk(created);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    const result = await store.create("proj-1", { name: "Sprint A" });

    expect(result).toEqual(created);
    expect(store.sprints[0]).toEqual(created);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/api/projects/proj-1/sprints");
    expect((init as RequestInit).method).toBe("POST");
  });
});

describe("useSprintsStore — update", () => {
  it("PATCHes and replaces in-place", async () => {
    const updated = { ...sample, name: "Renamed" };
    const fetchSpy = mockFetchOk(updated);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    store.sprints = [sample];
    const result = await store.update("proj-1", "sprint-1", { name: "Renamed" });

    expect(result).toEqual(updated);
    expect(store.sprints[0]).toEqual(updated);
  });

  it("rolls back optimistic update on failure", async () => {
    const fetchSpy = mockFetchError(400, { message: "name too long" });
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    store.sprints = [sample];
    await expect(
      store.update("proj-1", "sprint-1", { name: "X".repeat(200) }),
    ).rejects.toThrow();

    expect(store.sprints[0]).toEqual(sample);
  });

  it("sends milestoneId: null literal on detach", async () => {
    const updated = { ...sample, milestoneId: null };
    const fetchSpy = mockFetchOk(updated);
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    store.sprints = [{ ...sample, milestoneId: "m1" }];
    await store.update("proj-1", "sprint-1", { milestoneId: null });

    const [, init] = fetchSpy.mock.calls[0]!;
    const bodyArg = JSON.parse((init as RequestInit).body as string);
    expect(bodyArg).toEqual({ milestoneId: null });
  });
});

describe("useSprintsStore — remove", () => {
  it("DELETEs and removes from list", async () => {
    const fetchSpy = mockFetchOk({});
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    store.sprints = [sample];
    await store.remove("proj-1", "sprint-1");

    expect(store.sprints).toEqual([]);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/api/projects/proj-1/sprints/sprint-1");
    expect((init as RequestInit).method).toBe("DELETE");
  });

  it("rolls back on failure", async () => {
    const fetchSpy = mockFetchError(404, { message: "Unknown" });
    vi.stubGlobal("fetch", fetchSpy);

    const store = useSprintsStore();
    store.sprints = [sample];
    await expect(store.remove("proj-1", "sprint-1")).rejects.toThrow();

    expect(store.sprints).toEqual([sample]);
  });
});

describe("useSprintsStore — reset", () => {
  it("clears all state", () => {
    const store = useSprintsStore();
    store.sprints = [sample];
    store.loading = true;
    store.error = "boom";
    store.reset();

    expect(store.sprints).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});