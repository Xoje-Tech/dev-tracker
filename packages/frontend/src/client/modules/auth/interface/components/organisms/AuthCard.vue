<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
  }>(),
  { subtitle: "" },
);
</script>

<template>
  <section
    class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
  >
    <header class="mb-6 space-y-1 text-center">
      <h1 class="text-2xl font-semibold text-gray-900">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-gray-500">{{ subtitle }}</p>
    </header>
    <slot />
  </section>
</template>
