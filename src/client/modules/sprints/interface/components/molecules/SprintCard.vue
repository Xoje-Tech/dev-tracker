<script setup lang="ts">
import { computed } from "vue";
import type { Sprint } from "@client/sprints/domain/types";

const props = defineProps<{
  sprint: Sprint;
}>();

const emit = defineEmits<{
  (e: "select", sprintId: string): void;
}>();

const milestoneLabel = computed(() => {
  if (!props.sprint.milestoneId) return "(none)";
  return props.sprint.milestoneId.slice(0, 8) + "…";
});

function handleSelect(): void {
  emit("select", props.sprint.id);
}
</script>

<template>
  <article
    class="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow"
  >
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-base font-semibold text-gray-900">
        {{ sprint.name }}
      </h3>
      <p
        v-if="sprint.description"
        class="mt-1 line-clamp-2 text-sm text-gray-600"
      >
        {{ sprint.description }}
      </p>
      <p class="mt-2 text-xs text-gray-500">
        Milestone: {{ milestoneLabel }}
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-3">
      <button
        type="button"
        class="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
        :aria-label="`Edit sprint ${sprint.name}`"
        @click="handleSelect"
      >
        Edit
      </button>
    </div>
  </article>
</template>