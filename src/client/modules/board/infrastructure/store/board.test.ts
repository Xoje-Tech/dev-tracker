import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useBoardStore } from "@client/board/infrastructure/store/board";
import { mockFetch } from "../../../../../../tests/client-helpers";
import type { Board, BoardTask } from "@client/board/domain/types";

const sampleTask: BoardTask = {
  id: "t1",
  title: "Do thing",
  description: null,
  priority: "medium",
  order: 0,
  assigneeId: null,
  tagIds: [],
  createdAt: "2026-06-29T00:00:00.000Z",
};

const sampleBoard: Board = {
  id: "b1",
  projectId: "p1",
  columns: [
    { id: "c1", title: "Todo", order: 0, tasks: [sampleTask] },
    { id: "c2", title: "Done", order: 1, tasks: [] },
  ],
};

describe("useBoardStore", () => {
  let fetch: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    fetch = mockFetch();
  });

  it("fetchBoard sets board on success", async () => {
    fetch.enqueue({ status: 200, body: sampleBoard });
    const store = useBoardStore();
    const result = await store.fetchBoard("p1");
    await fetch.drain();

    expect(result).toEqual(sampleBoard);
    expect(store.board).toEqual(sampleBoard);
  });

  it("fetchBoard returns null and sets error on failure", async () => {
    fetch.enqueue({ status: 404, body: { message: "no board" } });
    const store = useBoardStore();
    const result = await store.fetchBoard("missing");
    await fetch.drain();

    expect(result).toBeNull();
    expect(store.error).toBe("no board");
  });

  it("createTask appends the new task to the target column", async () => {
    const created = { ...sampleTask, id: "t2", title: "New" };
    fetch.enqueue({ status: 201, body: created });
    const store = useBoardStore();
    store.board = structuredClone(sampleBoard);

    const result = await store.createTask({ columnId: "c1", title: "New" });
    await fetch.drain();

    expect(result).toEqual(created);
    expect(store.board?.columns[0]?.tasks).toHaveLength(2);
    expect(store.board?.columns[0]?.tasks[1]).toEqual(created);
  });

  it("updateTask replaces the matching task across columns", async () => {
    const updated = { ...sampleTask, title: "Renamed" };
    fetch.enqueue({ status: 200, body: updated });
    const store = useBoardStore();
    store.board = structuredClone(sampleBoard);

    await store.updateTask("t1", { title: "Renamed" });
    await fetch.drain();

    expect(store.board?.columns[0]?.tasks[0]?.title).toBe("Renamed");
  });

  it("deleteTask removes the task from its column", async () => {
    fetch.enqueue({ status: 200, body: { message: "ok" } });
    const store = useBoardStore();
    store.board = structuredClone(sampleBoard);

    await store.deleteTask("t1");
    await fetch.drain();

    expect(store.board?.columns[0]?.tasks).toHaveLength(0);
  });

  it("moveTask moves a task across columns at the right index", async () => {
    fetch.enqueue({ status: 200, body: { message: "moved" } });
    const store = useBoardStore();
    store.board = structuredClone(sampleBoard);

    await store.moveTask("t1", "c1", { targetColumnId: "c2", newIndex: 0 });
    await fetch.drain();

    expect(store.board?.columns[0]?.tasks).toHaveLength(0);
    expect(store.board?.columns[1]?.tasks).toHaveLength(1);
    expect(store.board?.columns[1]?.tasks[0]?.id).toBe("t1");
  });
});
