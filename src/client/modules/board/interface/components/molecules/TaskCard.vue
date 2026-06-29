<script setup lang="ts">
import PriorityBadge from "@client/board/interface/components/atoms/PriorityBadge.vue";
import type { BoardTask } from "@client/board/domain/types";

defineProps<{
  task: BoardTask;
}>();

defineEmits<{
  edit: [task: BoardTask];
  delete: [task: BoardTask];
}>();
</script>

<template>
  <div
    class="group cursor-pointer rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow"
    role="button"
    tabindex="0"
    @click="$emit('edit', task)"
    @keydown.enter="$emit('edit', task)"
  >
    <div class="flex items-start justify-between gap-2">
      <h4 class="text-sm font-medium text-slate-900">{{ task.title }}</h4>
      <button
        type="button"
        class="invisible rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 group-hover:visible focus:visible"
        :aria-label="`Delete ${task.title}`"
        @click.stop="$emit('delete', task)"
      >
        ×
      </button>
    </div>
    <p
      v-if="task.description"
      class="mt-1 line-clamp-2 text-xs text-slate-500"
    >
      {{ task.description }}
    </p>
    <div class="mt-2 flex items-center gap-2">
      <PriorityBadge :priority="task.priority" />
    </div>
  </div>
</template>
