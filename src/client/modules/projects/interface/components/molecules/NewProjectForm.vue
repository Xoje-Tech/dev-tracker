<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";
import BaseTextarea from "@client/shared/interface/components/atoms/BaseTextarea.vue";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";

const projectsStore = useProjectsStore();
const router = useRouter();

const name = ref("");
const description = ref("");
const repoUrl = ref("");
const nameError = ref<string | null>(null);
const repoUrlError = ref<string | null>(null);
const formError = ref<string | null>(null);
const submitting = ref(false);

function reset(): void {
  name.value = "";
  description.value = "";
  repoUrl.value = "";
  nameError.value = null;
  repoUrlError.value = null;
  formError.value = null;
}

async function onSubmit(event: Event): Promise<void> {
  event.preventDefault();
  nameError.value = null;
  repoUrlError.value = null;
  formError.value = null;

  const trimmed = name.value.trim();
  if (trimmed.length === 0) {
    nameError.value = "Name is required";
    return;
  }
  if (trimmed.length > 100) {
    nameError.value = "Name must be 100 characters or fewer";
    return;
  }

  const urlVal = repoUrl.value.trim();
  if (urlVal) {
    try {
      new URL(urlVal);
    } catch (e) {
      repoUrlError.value = "Must be a valid URL";
      return;
    }
  }

  submitting.value = true;
  try {
    const project = await projectsStore.create({
      name: trimmed,
      description: description.value.trim() || undefined,
      repoUrl: urlVal || undefined,
    });
    reset();
    await router.push({ name: "board", params: { id: project.id } });
  } catch (e) {
    formError.value = e instanceof Error ? e.message : "Could not create project";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <FormField label="Name" html-for="project-name" :error="nameError" required>
      <BaseInput
        id="project-name"
        v-model="name"
        placeholder="My project"
        :invalid="!!nameError"
        :disabled="submitting"
        autocomplete="off"
      />
    </FormField>
    <FormField label="Description" html-for="project-description">
      <BaseTextarea
        id="project-description"
        v-model="description"
        :rows="3"
        placeholder="What is this project about?"
        :disabled="submitting"
      />
    </FormField>
    <FormField label="Repository URL" html-for="project-repo-url" :error="repoUrlError">
      <BaseInput
        id="project-repo-url"
        v-model="repoUrl"
        placeholder="https://github.com/..."
        :invalid="!!repoUrlError"
        :disabled="submitting"
        autocomplete="off"
        type="url"
      />
    </FormField>
    <p v-if="formError" class="text-sm text-red-600" role="alert">{{ formError }}</p>
    <div class="flex justify-end gap-2">
      <BaseButton type="submit" :loading="submitting">Create project</BaseButton>
    </div>
  </form>
</template>
