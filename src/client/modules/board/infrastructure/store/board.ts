import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@client/shared/infrastructure/composables/useApi";
import { PROJECTS_ROUTES } from "@projects/domain/routes";
import { TASKS_ROUTES } from "@tasks/domain/routes";
import type {
  Board,
  BoardColumn,
  BoardTask,
  CreateTaskInput,
  MoveTaskInput,
  UpdateTaskInput,
} from "@client/board/domain/types";

/**
 * Board module — Pinia store.
 *
 * Owns the active board and its nested columns/tasks. Tasks are not
 * a separate store because they always render inside a column, and
 * keeping the nested shape avoids cross-store sync after a move.
 *
 * Endpoints:
 *   GET  /api/projects/:projectId/board       — fetch (creates default if missing)
 *   POST /api/                                — create task
 *   PATCH /api/tasks/:id                      — update task
 *   DELETE /api/tasks/:id                     — delete task
 *   POST /api/tasks/:id/move                  — move task (column + index)
 */
export const useBoardStore = defineStore("board", () => {
  const boardApi = useApi(PROJECTS_ROUTES.base);
  const taskApi = useApi(TASKS_ROUTES.base);

  const board = ref<Board | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function replaceColumnTasks(columnId: string, tasks: BoardTask[]): void {
    if (!board.value) return;
    const col = board.value.columns.find((c) => c.id === columnId);
    if (col) col.tasks = tasks;
  }

  function removeTaskFromAllColumns(taskId: string): BoardColumn | null {
    if (!board.value) return null;
    for (const col of board.value.columns) {
      const idx = col.tasks.findIndex((t) => t.id === taskId);
      if (idx >= 0) {
        return col;
      }
    }
    return null;
  }

  async function fetchBoard(projectId: string): Promise<Board | null> {
    loading.value = true;
    error.value = null;
    try {
      const fetched = await boardApi.get<Board>(`/${projectId}/board`);
      board.value = fetched;
      return fetched;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load board";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createTask(input: CreateTaskInput): Promise<BoardTask> {
    const created = await taskApi.post<BoardTask>("/", {
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "medium",
      order: 0,
      assigneeId: input.assigneeId,
    });
    if (board.value) {
      const col = board.value.columns.find((c) => c.id === input.columnId);
      if (col) col.tasks = [...col.tasks, created];
    }
    return created;
  }

  async function updateTask(id: string, input: UpdateTaskInput): Promise<BoardTask> {
    const updated = await taskApi.patch<BoardTask>(`/${id}`, input);
    if (board.value) {
      for (const col of board.value.columns) {
        const idx = col.tasks.findIndex((t) => t.id === id);
        if (idx >= 0) {
          col.tasks = [...col.tasks.slice(0, idx), updated, ...col.tasks.slice(idx + 1)];
          break;
        }
      }
    }
    return updated;
  }

  async function deleteTask(id: string): Promise<void> {
    await taskApi.del(`/${id}`);
    if (board.value) {
      for (const col of board.value.columns) {
        const idx = col.tasks.findIndex((t) => t.id === id);
        if (idx >= 0) {
          col.tasks = [...col.tasks.slice(0, idx), ...col.tasks.slice(idx + 1)];
          break;
        }
      }
    }
  }

  async function moveTask(
    taskId: string,
    fromColumnId: string,
    input: MoveTaskInput,
  ): Promise<void> {
    await taskApi.post(`/${taskId}/move`, input);
    if (!board.value) return;

    const fromCol = board.value.columns.find((c) => c.id === fromColumnId);
    const toCol = board.value.columns.find((c) => c.id === input.targetColumnId);
    if (!fromCol || !toCol) return;

    const idx = fromCol.tasks.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    const [moved] = fromCol.tasks.splice(idx, 1);
    moved && toCol.tasks.splice(input.newIndex, 0, moved);
  }

  return {
    board,
    loading,
    error,
    fetchBoard,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    removeTaskFromAllColumns,
    replaceColumnTasks,
  };
});
