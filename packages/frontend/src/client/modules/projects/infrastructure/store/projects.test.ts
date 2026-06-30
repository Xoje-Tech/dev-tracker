import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";
import { mockFetch } from "../../../../../../../../tests/client-helpers";
import type { Project } from "@client/projects/domain/types";

const sampleProject: Project = {
  id: "p1",
  name: "Demo",
  description: null,
  archived: false,
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
  role: "owner",
};

describe("useProjectsStore", () => {
  let fetch: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    fetch = mockFetch();
  });

  it("fetchAll populates projects and clears error on success", async () => {
    fetch.enqueue({ status: 200, body: [sampleProject] });
    const store = useProjectsStore();
    await store.fetchAll();
    await fetch.drain();

    expect(store.projects).toEqual([sampleProject]);
    expect(store.error).toBeNull();
  });

  it("fetchAll sets error and keeps projects empty on failure", async () => {
    fetch.enqueue({ status: 500, body: { message: "boom" } });
    const store = useProjectsStore();
    await store.fetchAll();
    await fetch.drain();

    expect(store.projects).toEqual([]);
    expect(store.error).toBe("boom");
  });

  it("create prepends the new project to the list", async () => {
    const created = { ...sampleProject, id: "p2", name: "New" };
    fetch.enqueue({ status: 201, body: created });
    const store = useProjectsStore();
    store.projects = [sampleProject];

    const result = await store.create({ name: "New" });
    await fetch.drain();

    expect(result).toEqual(created);
    expect(store.projects[0]).toEqual(created);
  });

  it("update replaces the matching project in the list and in current", async () => {
    const updated = { ...sampleProject, name: "Renamed" };
    fetch.enqueue({ status: 200, body: updated });
    const store = useProjectsStore();
    store.projects = [sampleProject];
    store.current = sampleProject;

    await store.update("p1", { name: "Renamed" });
    await fetch.drain();

    expect(store.projects[0]).toEqual(updated);
    expect(store.current).toEqual(updated);
  });

  it("archive replaces the matching project with the archived one", async () => {
    const archived = { ...sampleProject, archived: true };
    fetch.enqueue({ status: 200, body: archived });
    const store = useProjectsStore();
    store.projects = [sampleProject];

    await store.archive("p1");
    await fetch.drain();

    expect(store.projects[0]?.archived).toBe(true);
  });

  it("fetchOne returns null and sets error on failure", async () => {
    fetch.enqueue({ status: 404, body: { message: "not found" } });
    const store = useProjectsStore();
    const result = await store.fetchOne("missing");
    await fetch.drain();

    expect(result).toBeNull();
    expect(store.error).toBe("not found");
    expect(store.current).toBeNull();
  });
});
