<script setup lang="ts">
import BaseModal from "@client/shared/interface/components/atoms/BaseModal.vue";
import NewProjectForm from "@client/projects/interface/components/molecules/NewProjectForm.vue";

defineProps<{
  open: boolean;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <BaseModal :open="open" title="New project" size="md" @close="$emit('close')">
    <NewProjectForm @cancel="$emit('close')" />
  </BaseModal>
</template>
