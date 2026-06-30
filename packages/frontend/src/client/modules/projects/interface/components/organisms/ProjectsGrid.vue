<script setup lang="ts">
import EmptyState from "@client/shared/interface/components/molecules/EmptyState.vue";
import ProjectCard from "@client/projects/interface/components/molecules/ProjectCard.vue";
import type { Project } from "@client/projects/domain/types";

defineProps<{
  projects: Project[];
  loading: boolean;
}>();

defineEmits<{
  "new-project": [];
}>();
</script>

<template>
  <div>
    <div v-if="loading" class="text-sm text-slate-500">Loading projects…</div>
    <div
      v-else-if="projects.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
      />
    </div>
    <EmptyState
      v-else
      title="No projects yet"
      description="Create your first project to start tracking work on a kanban board."
    >
      <template #action>
        <button
          type="button"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          @click="$emit('new-project')"
        >
          New project
        </button>
      </template>
    </EmptyState>
  </div>
</template>
