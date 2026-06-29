<script setup lang="ts">
import KanbanColumn from "@client/board/interface/components/organisms/KanbanColumn.vue";
import type { Board, BoardTask } from "@client/board/domain/types";

defineProps<{
  board: Board;
}>();

defineEmits<{
  "add-task": [columnId: string];
  "edit-task": [task: BoardTask];
  "delete-task": [task: BoardTask];
  "move-task": [
    payload: {
      taskId: string;
      fromColumnId: string;
      toColumnId: string;
      newIndex: number;
    },
  ];
}>();
</script>

<template>
  <div class="flex h-full gap-4 overflow-x-auto pb-4">
    <KanbanColumn
      v-for="column in board.columns"
      :key="column.id"
      :column="column"
      @add-task="(id) => $emit('add-task', id)"
      @edit-task="(t) => $emit('edit-task', t)"
      @delete-task="(t) => $emit('delete-task', t)"
      @move-task="(p) => $emit('move-task', p)"
    />
  </div>
</template>
