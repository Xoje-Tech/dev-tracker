<script setup lang="ts">
import { computed } from "vue";
import BaseBadge from "@client/shared/interface/components/atoms/BaseBadge.vue";
import type { Priority } from "@client/board/domain/types";

const props = defineProps<{
  priority: Priority;
}>();

const variant = computed(() =>
  props.priority === "high"
    ? "danger"
    : props.priority === "medium"
      ? "warning"
      : "default",
);

const label = computed(() =>
  props.priority.charAt(0).toUpperCase() + props.priority.slice(1),
);
</script>

<template>
  <BaseBadge :variant="variant">{{ label }}</BaseBadge>
</template>
