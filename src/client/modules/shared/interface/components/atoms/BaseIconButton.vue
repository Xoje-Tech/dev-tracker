<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "danger" | "ghost";
    disabled?: boolean;
    loading?: boolean;
    label: string;
  }>(),
  {
    type: "button",
    variant: "ghost",
    disabled: false,
    loading: false,
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="label"
    :title="label"
    class="inline-flex h-9 w-9 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
    :class="
      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
        : variant === 'secondary'
          ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
          : variant === 'danger'
            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300'
    "
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      aria-hidden="true"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
    <slot v-else />
  </button>
</template>
