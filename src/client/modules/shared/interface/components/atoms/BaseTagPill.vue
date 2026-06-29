<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  name: string;
  color: string;
}>();

const emit = defineEmits<{
  remove: [];
}>();

const style = computed(() => ({
  backgroundColor: `${props.color}1A`,
  color: props.color,
  borderColor: `${props.color}33`,
}));
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
    :style="style"
  >
    {{ name }}
    <button
      v-if="$slots.remove || true"
      type="button"
      class="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
      :aria-label="`Remove ${name}`"
      @click="emit('remove')"
    >
      ×
    </button>
  </span>
</template>
