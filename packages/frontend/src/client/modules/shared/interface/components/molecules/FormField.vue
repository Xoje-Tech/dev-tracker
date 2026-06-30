<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    error?: string | null;
    required?: boolean;
    htmlFor?: string;
  }>(),
  {
    error: null,
    required: false,
    htmlFor: undefined,
  },
);
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" :for="htmlFor" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
  </div>
</template>
