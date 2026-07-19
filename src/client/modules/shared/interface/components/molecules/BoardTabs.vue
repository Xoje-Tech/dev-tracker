<script setup lang="ts">
import { RouterLink } from "vue-router";

export interface BoardTab {
  label: string;
  to: string;
}

defineProps<{
  tabs: BoardTab[];
}>();
</script>

<template>
  <nav
    aria-label="Project sections"
    class="flex flex-wrap items-center gap-2 border-b border-gray-200"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="rounded-t px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
      active-class="border-b-2 border-sky-500 text-sky-700"
      exact-active-class="border-b-2 border-sky-500 text-sky-700"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
