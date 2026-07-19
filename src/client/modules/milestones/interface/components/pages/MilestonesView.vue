<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useMilestonesStore } from "@client/milestones/infrastructure/store/milestones";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";
import PageHeader from "@client/shared/interface/components/molecules/PageHeader.vue";
import BoardTabs from "@client/shared/interface/components/molecules/BoardTabs.vue";
import MilestonesList from "@client/milestones/interface/components/organisms/MilestonesList.vue";
import MilestoneForm, {
  type DialogKind,
} from "@client/milestones/interface/components/molecules/MilestoneForm.vue";
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@client/milestones/domain/types";

const route = useRoute();
const router = useRouter();

const projectId = computed(() => String(route.params.id));
const milestoneIdFromRoute = computed(() =>
  route.params.milestoneId ? String(route.params.milestoneId) : null,
);

const milestonesStore = useMilestonesStore();
const projectsStore = useProjectsStore();
const { milestones, loading, error } = storeToRefs(milestonesStore);

const dialogKind = ref<DialogKind>("closed");
const dialogBusy = ref(false);
const dialogError = ref<string | null>(null);

const tabs = computed(() => [
  { label: "Board", to: `/projects/${projectId.value}/board` },
  { label: "Milestones", to: `/projects/${projectId.value}/milestones` },
]);

onMounted(async () => {
  await projectsStore.fetchAll();
  await milestonesStore.fetchAll(projectId.value);
  // Deep-link: open modal in edit mode if /:milestoneId is present.
  if (milestoneIdFromRoute.value) {
    await openEdit(milestoneIdFromRoute.value);
  }
});

watch(milestoneIdFromRoute, async (newId) => {
  if (newId) await openEdit(newId);
});

async function openCreate(): Promise<void> {
  dialogError.value = null;
  dialogKind.value = "create";
}

async function openEdit(id: string): Promise<void> {
  dialogError.value = null;
  dialogKind.value = "edit";
  await milestonesStore.fetchOne(projectId.value, id);
}

async function closeDialog(): Promise<void> {
  dialogKind.value = "closed";
  dialogError.value = null;
  // Clear deep-link param without triggering full re-fetch.
  if (milestoneIdFromRoute.value) {
    router.replace({
      name: "milestones",
      params: { id: projectId.value },
    });
  }
}

async function handleSubmit(
  payload:
    | { kind: "create"; input: CreateMilestoneInput }
    | { kind: "update"; input: UpdateMilestoneInput },
): Promise<void> {
  dialogBusy.value = true;
  dialogError.value = null;
  try {
    if (payload.kind === "create") {
      await milestonesStore.create(projectId.value, payload.input);
    } else if (milestoneIdFromRoute.value) {
      await milestonesStore.update(
        projectId.value,
        milestoneIdFromRoute.value,
        payload.input,
      );
    }
    dialogKind.value = "closed";
  } catch (e) {
    dialogError.value =
      e instanceof Error ? e.message : "Could not save milestone";
  } finally {
    dialogBusy.value = false;
  }
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-6">
    <PageHeader
      title="Milestones"
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
        New milestone
      </button>
    </div>

    <MilestonesList
      :milestones="milestones"
      :loading="loading"
      :error="error"
      @select="openEdit"
      @create="openCreate"
    />

    <MilestoneForm
      :open="dialogKind !== 'closed'"
      :kind="dialogKind"
      :milestone="
        milestoneIdFromRoute
          ? milestones.find((m) => m.id === milestoneIdFromRoute) ?? null
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