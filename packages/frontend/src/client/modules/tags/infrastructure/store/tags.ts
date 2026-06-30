import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@client/shared/infrastructure/composables/useApi";
import type { CreateTagInput, Tag } from "@client/tags/domain/types";

/**
 * Tags module — Pinia store.
 * Endpoints:
 *   GET    /api/tags                      — list
 *   POST   /api/tags                      — create
 *   POST   /api/tasks/:taskId/tags/:tagId — assign to task
 *   DELETE /api/tasks/:taskId/tags/:tagId — unassign from task
 *
 * The assign/unassign actions are wired here but cannot be exercised
 * from the kanban yet — see the gap note in AGENTS.md (BoardTaskDto
 * does not include assigned tag ids, so TaskCard/TaskForm have no
 * way to read them). When the backend DTO is extended, wire the
 * assign/unassign into the task dialog.
 */
export const useTagsStore = defineStore("tags", () => {
  const api = useApi("/api/tags");
  const taskApi = useApi("/api");

  const tags = ref<Tag[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      tags.value = await api.get<Tag[]>("/");
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load tags";
    } finally {
      loading.value = false;
    }
  }

  async function create(input: CreateTagInput): Promise<Tag> {
    const tag = await api.post<Tag>("/", input);
    tags.value = [...tags.value, tag];
    return tag;
  }

  async function assignToTask(taskId: string, tagId: string): Promise<void> {
    await taskApi.post(`/tasks/${taskId}/tags/${tagId}`);
  }

  async function unassignFromTask(taskId: string, tagId: string): Promise<void> {
    await taskApi.del(`/tasks/${taskId}/tags/${tagId}`);
  }

  return {
    tags,
    loading,
    error,
    fetchAll,
    create,
    assignToTask,
    unassignFromTask,
  };
});
