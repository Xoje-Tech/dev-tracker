<script setup lang="ts">
import BaseSpinner from "@client/shared/interface/components/atoms/BaseSpinner.vue";
import EmptyState from "@client/shared/interface/components/molecules/EmptyState.vue";
import SprintCard from "@client/sprints/interface/components/molecules/SprintCard.vue";
import type { Sprint } from "@client/sprints/domain/types";

defineProps<{
  sprints: Sprint[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "select", sprintId: string): void;
  (e: "create"): void;
}>();
</script>

<template>
  <section aria-label="Sprints">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner />
    </div>
    <p v-else-if="error" class="text-sm text-red-600" role="alert">
      {{ error }}
    </p>
    <EmptyState
      v-else-if="sprints.length === 0"
      title="No sprints yet"
      description="Sprints are short cycles of work. Create your first one to get started."
    >
      <template #action>
        <button
          type="button"
          class="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          @click="emit('create')"
        >
          New sprint
        </button>
      </template>
    </EmptyState>
    <ul v-else class="space-y-3">
      <li v-for="s in sprints" :key="s.id">
        <SprintCard :sprint="s" @select="emit('select', $event)" />
      </li>
    </ul>
  </section>
</template>