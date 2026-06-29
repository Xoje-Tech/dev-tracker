<script setup lang="ts">
import { ref, watch } from "vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";
import BaseSelect from "@client/shared/interface/components/atoms/BaseSelect.vue";
import BaseTextarea from "@client/shared/interface/components/atoms/BaseTextarea.vue";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import TaskTagsField from "@client/board/interface/components/molecules/TaskTagsField.vue";
import { PRIORITY_OPTIONS, type Priority } from "@client/board/domain/types";
import type { Tag } from "@client/tags/domain/types";

const props = defineProps<{
  initialTitle?: string;
  initialDescription?: string | null;
  initialPriority?: Priority;
  initialTagIds?: string[];
  availableTags?: Tag[];
  submitLabel: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      title: string;
      description: string | null;
      priority: Priority;
      tagIds: string[];
    },
  ];
  cancel: [];
}>();

const title = ref(props.initialTitle ?? "");
const description = ref(props.initialDescription ?? "");
const priority = ref<Priority>(props.initialPriority ?? "medium");
const tagIds = ref<string[]>(props.initialTagIds ?? []);
const titleError = ref<string | null>(null);

watch(
  () => [
    props.initialTitle,
    props.initialDescription,
    props.initialPriority,
    props.initialTagIds,
  ],
  ([t, d, p, tags]) => {
    title.value = (t as string | undefined) ?? "";
    description.value = (d as string | null | undefined) ?? "";
    priority.value = (p as Priority | undefined) ?? "medium";
    tagIds.value = (tags as string[] | undefined) ?? [];
    titleError.value = null;
  },
);

function onSubmit(event: Event): void {
  event.preventDefault();
  const trimmed = title.value.trim();
  if (trimmed.length === 0) {
    titleError.value = "Title is required";
    return;
  }
  if (trimmed.length > 200) {
    titleError.value = "Title must be 200 characters or fewer";
    return;
  }
  emit("submit", {
    title: trimmed,
    description: description.value.trim() === "" ? null : description.value.trim(),
    priority: priority.value,
    tagIds: tagIds.value,
  });
}
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <FormField label="Title" html-for="task-title" :error="titleError" required>
      <BaseInput
        id="task-title"
        v-model="title"
        placeholder="What needs to be done?"
        :invalid="!!titleError"
        :disabled="busy"
      />
    </FormField>
    <FormField label="Description" html-for="task-description">
      <BaseTextarea
        id="task-description"
        v-model="description"
        :rows="4"
        placeholder="Optional details"
        :disabled="busy"
      />
    </FormField>
    <FormField label="Priority" html-for="task-priority">
      <BaseSelect
        id="task-priority"
        v-model="priority"
        :options="PRIORITY_OPTIONS"
        :disabled="busy"
      />
    </FormField>
    <FormField label="Tags" html-for="task-tags-hint">
      <span id="task-tags-hint" class="sr-only">Click to toggle tags</span>
      <TaskTagsField
        :available-tags="availableTags ?? []"
        v-model="tagIds"
      />
    </FormField>
    <div class="flex justify-end gap-2">
      <BaseButton variant="secondary" type="button" :disabled="busy" @click="$emit('cancel')">
        Cancel
      </BaseButton>
      <BaseButton type="submit" :loading="busy">{{ submitLabel }}</BaseButton>
    </div>
  </form>
</template>
