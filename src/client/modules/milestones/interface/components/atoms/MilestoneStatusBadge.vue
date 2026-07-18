<script setup lang="ts">
import { computed } from "vue";
import BaseBadge from "@client/shared/interface/components/atoms/BaseBadge.vue";
import type { MilestoneStatus } from "@client/milestones/domain/types";

const props = defineProps<{
  status: MilestoneStatus;
}>();

const variant = computed<
  "default" | "success" | "warning" | "danger" | "info"
>(() => {
  switch (props.status) {
    case "open":
      return "info";
    case "closed":
      return "success";
    case "archived":
      return "warning";
    default:
      return "default";
  }
});

const label = computed(() => {
  switch (props.status) {
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
    default:
      return String(props.status);
  }
});
</script>

<template>
  <BaseBadge :variant="variant">{{ label }}</BaseBadge>
</template>