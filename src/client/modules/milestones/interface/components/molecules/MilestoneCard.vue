<script setup lang="ts">
import { computed } from "vue";
import MilestoneStatusBadge from "@client/milestones/interface/components/atoms/MilestoneStatusBadge.vue";
import type { Milestone } from "@client/milestones/domain/types";

const props = defineProps<{
  milestone: Milestone;
}>();

const emit = defineEmits<{
  (e: "select", milestoneId: string): void;
}>();

const dueLabel = computed(() => {
  if (!props.milestone.dueDate) return null;
  const d = new Date(props.milestone.dueDate);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

function handleSelect(): void {
  emit("select", props.milestone.id);
}
</script>

<template>
  <article
    class="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow"
  >
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-base font-semibold text-gray-900">
        {{ milestone.title }}
      </h3>
      <p
        v-if="milestone.description"
        class="mt-1 line-clamp-2 text-sm text-gray-600"
      >
        {{ milestone.description }}
      </p>
      <p v-if="dueLabel" class="mt-2 text-xs text-gray-500">
        Due {{ dueLabel }}
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-3">
      <MilestoneStatusBadge :status="milestone.status" />
      <button
        type="button"
        class="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
        :aria-label="`Edit milestone ${milestone.title}`"
        @click="handleSelect"
      >
        Edit
      </button>
    </div>
  </article>
</template>