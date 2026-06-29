<script setup lang="ts">
import { computed } from "vue";
import type { Tag } from "@client/tags/domain/types";

const props = defineProps<{
  availableTags: Tag[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [ids: string[]];
}>();

const selected = computed(() => new Set(props.modelValue));

function toggle(tagId: string): void {
  const next = new Set(selected.value);
  if (next.has(tagId)) {
    next.delete(tagId);
  } else {
    next.add(tagId);
  }
  emit("update:modelValue", Array.from(next));
}
</script>

<template>
  <div>
    <p v-if="availableTags.length === 0" class="text-sm text-slate-500">
      No tags yet. Create some in the Tags page to label tasks.
    </p>
    <div v-else class="flex flex-wrap gap-2">
      <button
        v-for="tag in availableTags"
        :key="tag.id"
        type="button"
        class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
        :class="
          selected.has(tag.id)
            ? 'border-transparent text-white shadow-sm'
            : 'bg-white text-slate-600 hover:border-slate-300'
        "
        :style="
          selected.has(tag.id)
            ? { backgroundColor: tag.color }
            : { borderColor: tag.color + '55' }
        "
        :aria-pressed="selected.has(tag.id)"
        @click="toggle(tag.id)"
      >
        {{ tag.name }}
      </button>
    </div>
  </div>
</template>
