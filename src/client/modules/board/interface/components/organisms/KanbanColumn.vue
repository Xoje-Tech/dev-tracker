<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import ColumnHeader from "@client/board/interface/components/molecules/ColumnHeader.vue";
import TaskCard from "@client/board/interface/components/molecules/TaskCard.vue";
import type { BoardColumn, BoardTask } from "@client/board/domain/types";

const props = defineProps<{
  column: BoardColumn;
}>();

const emit = defineEmits<{
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

function onEnd(event: {
  item: HTMLElement;
  to: HTMLElement;
  from: HTMLElement;
  oldIndex: number | undefined;
  newIndex: number | undefined;
}): void {
  if (event.oldIndex === undefined || event.newIndex === undefined) return;
  if (event.oldIndex === event.newIndex && event.from === event.to) return;

  const taskId = event.item.dataset.taskId;
  const toColumnId = event.to.dataset.columnId ?? props.column.id;
  if (!taskId) return;

  emit("move-task", {
    taskId,
    fromColumnId: props.column.id,
    toColumnId,
    newIndex: event.newIndex,
  });
}
</script>

<template>
  <section
    class="flex w-72 shrink-0 flex-col rounded-lg bg-slate-100 p-3"
    :data-column-id="column.id"
  >
    <ColumnHeader :column="column" @add-task="(id) => $emit('add-task', id)" />

    <VueDraggable
      :model-value="column.tasks"
      :group="{ name: 'tasks', pull: true, put: true }"
      :animation="150"
      class="flex flex-1 flex-col gap-2 overflow-y-auto"
      :data-column-id="column.id"
      @end="onEnd"
    >
      <div
        v-for="task in column.tasks"
        :key="task.id"
        :data-task-id="task.id"
      >
        <TaskCard
          :task="task"
          @edit="(t) => $emit('edit-task', t)"
          @delete="(t) => $emit('delete-task', t)"
        />
      </div>
    </VueDraggable>
  </section>
</template>
