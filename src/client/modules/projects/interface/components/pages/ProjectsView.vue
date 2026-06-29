<script setup lang="ts">
import { onMounted, ref } from "vue";
import AuthenticatedLayout from "@client/auth/interface/components/templates/AuthenticatedLayout.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import EmptyState from "@client/shared/interface/components/molecules/EmptyState.vue";
import PageHeader from "@client/shared/interface/components/molecules/PageHeader.vue";
import NewProjectModal from "@client/projects/interface/components/organisms/NewProjectModal.vue";
import ProjectsGrid from "@client/projects/interface/components/organisms/ProjectsGrid.vue";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";

const projectsStore = useProjectsStore();

const modalOpen = ref(false);

onMounted(async () => {
  await projectsStore.fetchAll();
});
</script>

<template>
  <AuthenticatedLayout>
    <PageHeader title="Projects" subtitle="All your work, in one place.">
      <template #actions>
        <BaseButton @click="modalOpen = true">New project</BaseButton>
      </template>
    </PageHeader>

    <ProjectsGrid
      :projects="projectsStore.projects"
      :loading="projectsStore.loading"
      @new-project="modalOpen = true"
    />

    <p v-if="projectsStore.error" class="mt-4 text-sm text-red-600" role="alert">
      {{ projectsStore.error }}
    </p>

    <NewProjectModal :open="modalOpen" @close="modalOpen = false" />
  </AuthenticatedLayout>
</template>
