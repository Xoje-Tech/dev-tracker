<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useSprintsStore } from "@client/sprints/infrastructure/store/sprints";
import { useMilestonesStore } from "@client/milestones/infrastructure/store/milestones";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";
import PageHeader from "@client/shared/interface/components/molecules/PageHeader.vue";
import BoardTabs from "@client/shared/interface/components/molecules/BoardTabs.vue";
import SprintsList from "@client/sprints/interface/components/organisms/SprintsList.vue";
import SprintForm, {
  type DialogKind,
} from "@client/sprints/interface/components/molecules/SprintForm.vue";
import type {
  CreateSprintInput,
  UpdateSprintInput,
} from "@client/sprints/domain/types";

const route = useRoute();
const router = useRouter();

const projectId = computed(() => String(route.params.id));
const sprintIdFromRoute = computed(() =>
  route.params.sprintId ? String(route.params.sprintId) : null,
);

const sprintsStore = useSprintsStore();
const milestonesStore = useMilestonesStore();
const projectsStore = useProjectsStore();
const { sprints, loading, error } = storeToRefs(sprintsStore);

const dialogKind = ref<DialogKind>("closed");
const dialogBusy = ref(false);
const dialogError = ref<string | null>(null);

const tabs = computed(() => [
  { label: "Board", to: `/projects/${projectId.value}/board` },
  { label: "Milestones", to: `/projects/${projectId.value}/milestones` },
  { label: "Sprints", to: `/projects/${projectId.value}/sprints` },
]);

onMounted(async () => {
  await projectsStore.fetchAll();
  await sprintsStore.fetchAll(projectId.value);
  // Pre-load milestones so the SprintForm's <select> is populated.
  await milestonesStore.fetchAll(projectId.value);
  if (sprintIdFromRoute.value) {
    await openEdit(sprintIdFromRoute.value);
  }
});

watch(sprintIdFromRoute, async (newId) => {
  if (newId) await openEdit(newId);
});

async function openCreate(): Promise<void> {
  dialogError.value = null;
  dialogKind.value = "create";
}

async function openEdit(id: string): Promise<void> {
  dialogError.value = null;
  dialogKind.value = "edit";
  await sprintsStore.fetchOne(projectId.value, id);
}

async function closeDialog(): Promise<void> {
  dialogKind.value = "closed";
  dialogError.value = null;
  if (sprintIdFromRoute.value) {
    router.replace({
      name: "sprints",
      params: { id: projectId.value },
    });
  }
}

async function handleSubmit(
  payload:
    | { kind: "create"; input: CreateSprintInput }
    | { kind: "update"; input: UpdateSprintInput },
): Promise<void> {
  dialogBusy.value = true;
  dialogError.value = null;
  try {
    if (payload.kind === "create") {
      await sprintsStore.create(projectId.value, payload.input);
    } else if (sprintIdFromRoute.value) {
      await sprintsStore.update(
        projectId.value,
        sprintIdFromRoute.value,
        payload.input,
      );
    }
    dialogKind.value = "closed";
  } catch (e) {
    dialogError.value =
      e instanceof Error ? e.message : "Could not save sprint";
  } finally {
    dialogBusy.value = false;
  }
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-6">
    <PageHeader
      title="Sprints"
      :subtitle="`Project ${projectId}`"
    >
      <template #tabs>
        <BoardTabs :tabs="tabs" />
      </template>
    </PageHeader>

    <div class="mb-4 flex justify-end">
      <button
        type="button"
        class="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        :disabled="loading"
        @click="openCreate"
      >
        New sprint
      </button>
    </div>

    <SprintsList
      :sprints="sprints"
      :loading="loading"
      :error="error"
      @select="openEdit"
      @create="openCreate"
    />

    <SprintForm
      :open="dialogKind !== 'closed'"
      :kind="dialogKind"
      :project-id="projectId"
      :sprint="
        sprintIdFromRoute
          ? sprints.find((s) => s.id === sprintIdFromRoute) ?? null
          : null
      "
      :busy="dialogBusy"
      @close="closeDialog"
      @submit="handleSubmit"
    />

    <p
      v-if="dialogError"
      class="mt-2 text-sm text-red-600"
      role="alert"
    >
      {{ dialogError }}
    </p>
  </main>
</template>