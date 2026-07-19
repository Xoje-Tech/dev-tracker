import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@client/shared/infrastructure/composables/useApi";
import { SPRINTS_ROUTES } from "@sprints/domain/routes";
import type {
  CreateSprintInput,
  Sprint,
  UpdateSprintInput,
} from "@client/sprints/domain/types";

/**
 * Sprints module — Pinia store.
 *
 * Owns the sprint list per project. Mirrors the pattern of
 * `useMilestonesStore`: composition API with `loading` + `error` refs,
 * optimistic mutations with rollback on 4xx/5xx.
 *
 * Endpoints (REST, parent-nested under /api/projects):
 *   GET    /api/projects/:projectId/sprints              — list
 *   GET    /api/projects/:projectId/sprints/:sprintId    — get one (added in PR #82 cli-mcp)
 *   POST   /api/projects/:projectId/sprints              — create
 *   PATCH  /api/projects/:projectId/sprints/:sprintId    — update (incl. milestoneId: null detach)
 *   DELETE /api/projects/:projectId/sprints/:sprintId    — hard delete
 */
export const useSprintsStore = defineStore("sprints", () => {
  const api = useApi(SPRINTS_ROUTES.base);

  const sprints = ref<Sprint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function buildUrl(
    projectId: string,
    sprintId: string,
  ): string {
    const base =
      sprintId !== undefined
        ? SPRINTS_ROUTES.item
            .replace(":projectId", projectId)
            .replace(":sprintId", sprintId)
        : SPRINTS_ROUTES.collection.replace(":projectId", projectId);
    return base;
  }

  async function fetchAll(projectId: string): Promise<Sprint[] | null> {
    loading.value = true;
    error.value = null;
    try {
      const fetched = await api.get<Sprint[]>(buildUrl(projectId, undefined as unknown as string));
      sprints.value = fetched;
      return fetched;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load sprints";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(
    projectId: string,
    sprintId: string,
  ): Promise<Sprint | null> {
    loading.value = true;
    error.value = null;
    try {
      const fetched = await api.get<Sprint>(buildUrl(projectId, sprintId));
      const idx = sprints.value.findIndex((s) => s.id === fetched.id);
      if (idx >= 0) {
        sprints.value = [
          ...sprints.value.slice(0, idx),
          fetched,
          ...sprints.value.slice(idx + 1),
        ];
      } else {
        sprints.value = [fetched, ...sprints.value];
      }
      return fetched;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load sprint";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function create(
    projectId: string,
    input: CreateSprintInput,
  ): Promise<Sprint> {
    const created = await api.post<Sprint>(
      buildUrl(projectId, undefined as unknown as string),
      {
        name: input.name,
        description: input.description ?? null,
        milestoneId: input.milestoneId ?? null,
      },
    );
    sprints.value = [created, ...sprints.value];
    return created;
  }

  async function update(
    projectId: string,
    sprintId: string,
    input: UpdateSprintInput,
  ): Promise<Sprint> {
    const previous = sprints.value.find((s) => s.id === sprintId);
    // Optimistic update — replace in place immediately.
    if (previous) {
      const optimistic: Sprint = {
        ...previous,
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.milestoneId !== undefined
          ? { milestoneId: input.milestoneId }
          : {}),
      };
      sprints.value = sprints.value.map((s) =>
        s.id === sprintId ? optimistic : s,
      );
    }
    try {
      const updated = await api.patch<Sprint>(
        buildUrl(projectId, sprintId),
        input,
      );
      sprints.value = sprints.value.map((s) =>
        s.id === sprintId ? updated : s,
      );
      return updated;
    } catch (e) {
      // Rollback on failure.
      if (previous) {
        sprints.value = sprints.value.map((s) =>
          s.id === sprintId ? previous : s,
        );
      }
      throw e;
    }
  }

  async function remove(
    projectId: string,
    sprintId: string,
  ): Promise<void> {
    const previous = sprints.value.find((s) => s.id === sprintId);
    if (previous) {
      sprints.value = sprints.value.filter(
        (s) => s.id !== sprintId,
      );
    }
    try {
      await api.del(buildUrl(projectId, sprintId));
    } catch (e) {
      if (previous) {
        sprints.value = [...sprints.value, previous].sort((a, b) =>
          a.createdAt < b.createdAt ? -1 : 1,
        );
      }
      throw e;
    }
  }

  function reset(): void {
    sprints.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    sprints,
    loading,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    reset,
  };
});