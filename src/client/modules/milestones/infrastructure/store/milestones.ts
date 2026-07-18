import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@client/shared/infrastructure/composables/useApi";
import { MILESTONES_ROUTES } from "@milestones/domain/routes";
import type {
  CreateMilestoneInput,
  Milestone,
  UpdateMilestoneInput,
} from "@client/milestones/domain/types";

/**
 * Milestones module — Pinia store.
 *
 * Owns the milestone list per project. Mirrors the pattern of `useBoardStore`:
 * composition API with `loading` + `error` refs, optimistic mutations with
 * rollback on 4xx/5xx.
 *
 * Endpoints (REST, parent-nested under /api/projects):
 *   GET    /api/projects/:projectId/milestones              — list (optional ?includeArchived=true)
 *   GET    /api/projects/:projectId/milestones/:milestoneId — get one (added in PR #82 cli-mcp)
 *   POST   /api/projects/:projectId/milestones              — create
 *   PATCH  /api/projects/:projectId/milestones/:milestoneId — update
 *   DELETE /api/projects/:projectId/milestones/:milestoneId — hard delete
 *   POST   /api/projects/:projectId/milestones/:milestoneId/archive — soft archive
 */
export const useMilestonesStore = defineStore("milestones", () => {
  const api = useApi(MILESTONES_ROUTES.base);

  const milestones = ref<Milestone[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function buildUrl(
    projectId: string,
    milestoneId: string,
    suffix = "",
  ): string {
    // MILESTONES_ROUTES.collection is e.g. "/:projectId/milestones"
    // MILESTONES_ROUTES.item is e.g. "/:projectId/milestones/:milestoneId"
    const base =
      milestoneId !== undefined
        ? MILESTONES_ROUTES.item
            .replace(":projectId", projectId)
            .replace(":milestoneId", milestoneId)
        : MILESTONES_ROUTES.collection.replace(":projectId", projectId);
    return base + suffix;
  }

  async function fetchAll(
    projectId: string,
    options: { includeArchived?: boolean } = {},
  ): Promise<Milestone[] | null> {
    loading.value = true;
    error.value = null;
    try {
      const qs = options.includeArchived ? "?includeArchived=true" : "";
      const fetched = await api.get<Milestone[]>(
        buildUrl(projectId, undefined as unknown as string) + qs,
      );
      milestones.value = fetched;
      return fetched;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load milestones";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(
    projectId: string,
    milestoneId: string,
  ): Promise<Milestone | null> {
    loading.value = true;
    error.value = null;
    try {
      const fetched = await api.get<Milestone>(buildUrl(projectId, milestoneId));
      // Replace in-place if present, else prepend.
      const idx = milestones.value.findIndex((m) => m.id === fetched.id);
      if (idx >= 0) {
        milestones.value = [
          ...milestones.value.slice(0, idx),
          fetched,
          ...milestones.value.slice(idx + 1),
        ];
      } else {
        milestones.value = [fetched, ...milestones.value];
      }
      return fetched;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load milestone";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function create(
    projectId: string,
    input: CreateMilestoneInput,
  ): Promise<Milestone> {
    const created = await api.post<Milestone>(
      buildUrl(projectId, undefined as unknown as string),
      {
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ?? null,
      },
    );
    milestones.value = [created, ...milestones.value];
    return created;
  }

  async function update(
    projectId: string,
    milestoneId: string,
    input: UpdateMilestoneInput,
  ): Promise<Milestone> {
    const previous = milestones.value.find((m) => m.id === milestoneId);
    // Optimistic update — replace in place immediately.
    if (previous) {
      const optimistic: Milestone = {
        ...previous,
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      milestones.value = milestones.value.map((m) =>
        m.id === milestoneId ? optimistic : m,
      );
    }
    try {
      const updated = await api.patch<Milestone>(
        buildUrl(projectId, milestoneId),
        input,
      );
      milestones.value = milestones.value.map((m) =>
        m.id === milestoneId ? updated : m,
      );
      return updated;
    } catch (e) {
      // Rollback on failure.
      if (previous) {
        milestones.value = milestones.value.map((m) =>
          m.id === milestoneId ? previous : m,
        );
      }
      throw e;
    }
  }

  async function archive(
    projectId: string,
    milestoneId: string,
  ): Promise<Milestone> {
    const previous = milestones.value.find((m) => m.id === milestoneId);
    if (previous) {
      milestones.value = milestones.value.map((m) =>
        m.id === milestoneId ? { ...m, status: "archived" } : m,
      );
    }
    try {
      const updated = await api.post<Milestone>(
        buildUrl(projectId, milestoneId) + "/archive",
      );
      milestones.value = milestones.value.map((m) =>
        m.id === milestoneId ? updated : m,
      );
      return updated;
    } catch (e) {
      if (previous) {
        milestones.value = milestones.value.map((m) =>
          m.id === milestoneId ? previous : m,
        );
      }
      throw e;
    }
  }

  async function remove(
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    const previous = milestones.value.find((m) => m.id === milestoneId);
    if (previous) {
      milestones.value = milestones.value.filter(
        (m) => m.id !== milestoneId,
      );
    }
    try {
      await api.del(buildUrl(projectId, milestoneId));
    } catch (e) {
      if (previous) {
        milestones.value = [...milestones.value, previous].sort((a, b) =>
          a.createdAt < b.createdAt ? -1 : 1,
        );
      }
      throw e;
    }
  }

  function reset(): void {
    milestones.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    milestones,
    loading,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    archive,
    remove,
    reset,
  };
});