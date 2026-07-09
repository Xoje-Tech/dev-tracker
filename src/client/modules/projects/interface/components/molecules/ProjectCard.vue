<script setup lang="ts">
import { useRouter } from "vue-router";
import BaseBadge from "@client/shared/interface/components/atoms/BaseBadge.vue";
import type { Project } from "@client/projects/domain/types";

const props = defineProps<{
  project: Project;
}>();

const router = useRouter();

function open(): void {
  void router.push({ name: "project-detail", params: { id: props.project.id } });
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="group flex w-full flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
    @click="open"
    @keydown.enter="open"
  >
    <div class="flex w-full items-start justify-between gap-2">
      <h3 class="truncate text-base font-semibold text-slate-900 group-hover:text-blue-700">
        {{ project.name }}
      </h3>
      <BaseBadge v-if="project.archived" variant="warning">Archived</BaseBadge>
    </div>
    
    <a 
      v-if="project.repoUrl"
      :href="project.repoUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate w-full flex items-center gap-1"
      @click.stop
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      {{ project.repoUrl.replace(/^https?:\/\//, '') }}
    </a>

    <p
      v-if="project.description"
      class="line-clamp-2 text-sm text-slate-500"
    >
      {{ project.description }}
    </p>
    <p v-else class="text-sm italic text-slate-400">No description</p>
    <p class="mt-auto text-xs uppercase tracking-wide text-slate-400">
      {{ project.role }}
    </p>
  </div>
</template>
