<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg";
    label?: string;
  }>(),
  { size: "md", label: "Loading" },
);
</script>

<template>
  <span
    role="status"
    :aria-label="label"
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    :class="size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'"
  />
</template>
