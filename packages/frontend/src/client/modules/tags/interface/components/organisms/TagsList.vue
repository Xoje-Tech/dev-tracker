<script setup lang="ts">
import BaseTagPill from "@client/shared/interface/components/atoms/BaseTagPill.vue";
import EmptyState from "@client/shared/interface/components/molecules/EmptyState.vue";
import type { Tag } from "@client/tags/domain/types";

defineProps<{
  tags: Tag[];
  loading: boolean;
}>();

defineEmits<{
  "new-tag": [];
}>();
</script>

<template>
  <div v-if="loading" class="text-sm text-slate-500">Loading tags…</div>
  <EmptyState
    v-else-if="tags.length === 0"
    title="No tags yet"
    description="Create tags to label tasks by category (bug, feature, urgent, etc)."
  >
    <template #action>
      <button
        type="button"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        @click="$emit('new-tag')"
      >
        New tag
      </button>
    </template>
  </EmptyState>
  <ul v-else class="flex flex-wrap gap-2">
    <li v-for="tag in tags" :key="tag.id">
      <BaseTagPill :name="tag.name" :color="tag.color" @remove="() => {}" />
    </li>
  </ul>
</template>
