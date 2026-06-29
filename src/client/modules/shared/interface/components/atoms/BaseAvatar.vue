<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: "xs" | "sm" | "md" | "lg";
    src?: string;
  }>(),
  { size: "md", src: undefined },
);

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

const sizeClass = computed(() =>
  props.size === "xs"
    ? "h-6 w-6 text-[10px]"
    : props.size === "sm"
      ? "h-8 w-8 text-xs"
      : props.size === "lg"
        ? "h-12 w-12 text-base"
        : "h-10 w-10 text-sm",
);
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 font-medium text-slate-700 ring-1 ring-slate-300"
    :class="sizeClass"
    :title="name"
  >
    <img v-if="src" :src="src" :alt="name" class="h-full w-full object-cover" />
    <template v-else>{{ initials }}</template>
  </span>
</template>
