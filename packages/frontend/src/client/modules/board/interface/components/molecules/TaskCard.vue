<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import BaseTagPill from "@client/shared/interface/components/atoms/BaseTagPill.vue";
import PriorityBadge from "@client/board/interface/components/atoms/PriorityBadge.vue";
import { useTagsStore } from "@client/tags/infrastructure/store/tags";
import type { BoardTask } from "@client/board/domain/types";

const props = defineProps<{
  task: BoardTask;
}>();

defineEmits<{
  edit: [task: BoardTask];
  delete: [task: BoardTask];
}>();

const tagsStore = useTagsStore();
const { tags: availableTags } = storeToRefs(tagsStore);

const assignedTags = computed(() =>
  props.task.tagIds
    .map((id) => availableTags.value.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined),
);
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
    <div v-if="assignedTags.length > 0" class="mt-2 flex flex-wrap gap-1">
      <BaseTagPill
        v-for="tag in assignedTags"
        :key="tag.id"
        :name="tag.name"
        :color="tag.color"
        @remove.stop
      />
    </div>
    <div class="mt-2 flex items-center gap-2">
      <PriorityBadge :priority="task.priority" />
    </div>
  </div>
</template>
