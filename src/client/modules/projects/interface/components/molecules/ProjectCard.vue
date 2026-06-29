<script setup lang="ts">
import { useRouter } from "vue-router";
import BaseBadge from "@client/shared/interface/components/atoms/BaseBadge.vue";
import type { Project } from "@client/projects/domain/types";

const props = defineProps<{
  project: Project;
}>();

const router = useRouter();

function open(): void {
  void router.push({ name: "board", params: { id: props.project.id } });
}
</script>

<template>
  <button
    type="button"
    class="group flex w-full flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
    @click="open"
  >
    <div class="flex w-full items-start justify-between gap-2">
      <h3 class="truncate text-base font-semibold text-slate-900 group-hover:text-blue-700">
        {{ project.name }}
      </h3>
      <BaseBadge v-if="project.archived" variant="warning">Archived</BaseBadge>
    </div>
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
  </button>
</template>
