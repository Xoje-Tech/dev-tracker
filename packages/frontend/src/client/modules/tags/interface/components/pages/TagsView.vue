<script setup lang="ts">
import { onMounted, ref } from "vue";
import AuthenticatedLayout from "@client/auth/interface/components/templates/AuthenticatedLayout.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseModal from "@client/shared/interface/components/atoms/BaseModal.vue";
import PageHeader from "@client/shared/interface/components/molecules/PageHeader.vue";
import NewTagForm from "@client/tags/interface/components/molecules/NewTagForm.vue";
import TagsList from "@client/tags/interface/components/organisms/TagsList.vue";
import { useTagsStore } from "@client/tags/infrastructure/store/tags";

const tagsStore = useTagsStore();
const modalOpen = ref(false);

onMounted(async () => {
  await tagsStore.fetchAll();
});
</script>

<template>
  <AuthenticatedLayout>
    <PageHeader
      title="Tags"
      subtitle="Labels you can attach to tasks. Tag assignment from the kanban is pending a backend DTO change."
    >
      <template #actions>
        <BaseButton @click="modalOpen = true">New tag</BaseButton>
      </template>
    </PageHeader>

    <p v-if="tagsStore.error" class="mb-4 text-sm text-red-600" role="alert">
      {{ tagsStore.error }}
    </p>

    <TagsList
      :tags="tagsStore.tags"
      :loading="tagsStore.loading"
      @new-tag="modalOpen = true"
    />

    <BaseModal
      :open="modalOpen"
      title="New tag"
      size="md"
      @close="modalOpen = false"
    >
      <NewTagForm @cancel="modalOpen = false" />
    </BaseModal>
  </AuthenticatedLayout>
</template>
