<script setup lang="ts">
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import type { BoardColumn } from "@client/board/domain/types";

defineProps<{
  column: BoardColumn;
}>();

defineEmits<{
  "add-task": [columnId: string];
}>();
</script>

<template>
  <header class="mb-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-700">
        {{ column.title }}
      </h3>
      <span class="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
        {{ column.tasks.length }}
      </span>
    </div>
    <BaseButton variant="ghost" :label="`Add task to ${column.title}`" @click="$emit('add-task', column.id)">
      +
    </BaseButton>
  </header>
</template>
