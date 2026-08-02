import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApi } from '@client/shared/infrastructure/composables/useApi';
import { PROJECTS_ROUTES } from '@projects/domain/routes';
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '@client/projects/domain/types';

/**
 * Projects module — Pinia store.
 * Wraps the backend projects endpoints under /api/projects:
 *   GET    /              — list all projects
 *   POST   /              — create
 *   GET    /:id           — get one
 *   PATCH  /:id           — update name and/or description
 *   POST   /:id/archive   — archive
 */
export const useProjectsStore = defineStore('projects', () => {
  const api = useApi(PROJECTS_ROUTES.base);

  const projects = ref<Project[]>([]);
  const current = ref<Project | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function replaceOne(updated: Project): void {
    const idx = projects.value.findIndex((p) => p.id === updated.id);
    if (idx >= 0) projects.value[idx] = updated;
    if (current.value?.id === updated.id) current.value = updated;
  }

  async function fetchAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      projects.value = await api.get<Project[]>('/');
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load projects';
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id: string): Promise<Project | null> {
    loading.value = true;
    error.value = null;
    try {
      const project = await api.get<Project>(`/${id}`);
      current.value = project;
      return project;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load project';
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function create(input: CreateProjectInput): Promise<Project> {
    const project = await api.post<Project>('/', input);
    projects.value = [project, ...projects.value];
    return project;
  }

  async function update(
    id: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    const project = await api.patch<Project>(`/${id}`, input);
    replaceOne(project);
    return project;
  }

  async function archive(id: string): Promise<void> {
    const project = await api.post<Project>(`/${id}/archive`);
    replaceOne(project);
  }

  const memories = ref<Record<string, unknown>[]>([]);
  const memoriesWarning = ref<string | null>(null);

  async function fetchMemories(id: string): Promise<void> {
    memories.value = [];
    memoriesWarning.value = null;
    try {
      const res = await api.get<{
        memories: Record<string, unknown>[];
        warning: string | null;
      }>(`/${id}/memories`);
      memories.value = res.memories;
      memoriesWarning.value = res.warning;
    } catch {
      memoriesWarning.value = 'Failed to load Engram memories';
    }
  }

  return {
    projects,
    current,
    memories,
    memoriesWarning,
    loading,
    error,
    fetchAll,
    fetchOne,
    fetchMemories,
    create,
    update,
    archive,
  };
});
