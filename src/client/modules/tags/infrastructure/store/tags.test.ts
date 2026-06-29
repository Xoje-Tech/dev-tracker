import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useTagsStore } from "@client/tags/infrastructure/store/tags";
import { mockFetch } from "../../../../../../tests/client-helpers";
import type { Tag } from "@client/tags/domain/types";

const sampleTag: Tag = { id: "tag1", name: "bug", color: "#ef4444" };

describe("useTagsStore", () => {
  let fetch: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    fetch = mockFetch();
  });

  it("fetchAll sets tags on success", async () => {
    fetch.enqueue({ status: 200, body: [sampleTag] });
    const store = useTagsStore();
    await store.fetchAll();
    await fetch.drain();

    expect(store.tags).toEqual([sampleTag]);
  });

  it("fetchAll sets error on failure", async () => {
    fetch.enqueue({ status: 500, body: { message: "boom" } });
    const store = useTagsStore();
    await store.fetchAll();
    await fetch.drain();

    expect(store.tags).toEqual([]);
    expect(store.error).toBe("boom");
  });

  it("create appends the new tag to the list", async () => {
    const created = { id: "tag2", name: "feature", color: "#10b981" };
    fetch.enqueue({ status: 201, body: created });
    const store = useTagsStore();
    store.tags = [sampleTag];

    const result = await store.create({ name: "feature", color: "#10b981" });
    await fetch.drain();

    expect(result).toEqual(created);
    expect(store.tags).toHaveLength(2);
    expect(store.tags[1]).toEqual(created);
  });

  it("assignToTask and unassignFromTask call the right URLs", async () => {
    fetch.enqueue({ status: 204, body: null });
    fetch.enqueue({ status: 204, body: null });
    const store = useTagsStore();

    await store.assignToTask("task1", sampleTag.id);
    await store.unassignFromTask("task1", sampleTag.id);
    await fetch.drain();

    expect(fetch.calls).toHaveLength(2);
    const [assign, unassign] = fetch.calls;
    expect(assign?.url).toContain(`/tasks/task1/tags/${sampleTag.id}`);
    expect(assign?.init?.method).toBe("POST");
    expect(unassign?.url).toContain(`/tasks/task1/tags/${sampleTag.id}`);
    expect(unassign?.init?.method).toBe("DELETE");
  });
});
