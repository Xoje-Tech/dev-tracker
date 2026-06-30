<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  type: "button",
  disabled: false,
  loading: false,
  block: false,
});

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      block ? 'w-full' : '',
      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
        : variant === 'secondary'
          ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
          : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
    ]"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      aria-hidden="true"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
    <slot />
  </button>
</template>
