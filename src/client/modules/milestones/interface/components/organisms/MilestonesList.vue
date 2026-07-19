<script setup lang="ts">
import BaseSpinner from "@client/shared/interface/components/atoms/BaseSpinner.vue";
import EmptyState from "@client/shared/interface/components/molecules/EmptyState.vue";
import MilestoneCard from "@client/milestones/interface/components/molecules/MilestoneCard.vue";
import type { Milestone } from "@client/milestones/domain/types";

defineProps<{
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "select", milestoneId: string): void;
  (e: "create"): void;
}>();
</script>

<template>
  <section aria-label="Milestones">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner />
    </div>
    <p v-else-if="error" class="text-sm text-red-600" role="alert">
      {{ error }}
    </p>
    <EmptyState
      v-else-if="milestones.length === 0"
      title="No milestones yet"
      description="Milestones group work by high-level goal. Create your first one to get started."
    >
      <template #action>
        <button
          type="button"
          class="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          @click="emit('create')"
        >
          New milestone
        </button>
      </template>
    </EmptyState>
    <ul v-else class="space-y-3">
      <li v-for="m in milestones" :key="m.id">
        <MilestoneCard :milestone="m" @select="emit('select', $event)" />
      </li>
    </ul>
  </section>
</template>