<script setup lang="ts">
import { ref } from "vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import { useTagsStore } from "@client/tags/infrastructure/store/tags";

const tagsStore = useTagsStore();

const name = ref("");
const color = ref("#3b82f6");
const nameError = ref<string | null>(null);
const formError = ref<string | null>(null);
const submitting = ref(false);

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
];

function reset(): void {
  name.value = "";
  color.value = "#3b82f6";
  nameError.value = null;
  formError.value = null;
}

async function onSubmit(event: Event): Promise<void> {
  event.preventDefault();
  nameError.value = null;
  formError.value = null;

  const trimmed = name.value.trim();
  if (trimmed.length === 0) {
    nameError.value = "Name is required";
    return;
  }
  if (trimmed.length > 50) {
    nameError.value = "Name must be 50 characters or fewer";
    return;
  }

  submitting.value = true;
  try {
    await tagsStore.create({ name: trimmed, color: color.value });
    reset();
  } catch (e) {
    formError.value = e instanceof Error ? e.message : "Could not create tag";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <FormField label="Name" html-for="tag-name" :error="nameError" required>
      <BaseInput
        id="tag-name"
        v-model="name"
        placeholder="bug"
        :invalid="!!nameError"
        :disabled="submitting"
      />
    </FormField>
    <FormField label="Color" html-for="tag-color">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="c in PRESET_COLORS"
          :key="c"
          type="button"
          class="h-7 w-7 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
          :class="color === c ? 'border-slate-900' : 'border-transparent'"
          :style="{ backgroundColor: c }"
          :aria-label="`Pick color ${c}`"
          :aria-pressed="color === c"
          @click="color = c"
        />
        <input
          id="tag-color"
          v-model="color"
          type="color"
          class="h-7 w-7 cursor-pointer rounded border border-slate-300"
          aria-label="Custom color"
        />
        <span class="font-mono text-xs text-slate-500">{{ color }}</span>
      </div>
    </FormField>
    <p v-if="formError" class="text-sm text-red-600" role="alert">{{ formError }}</p>
    <div class="flex justify-end">
      <BaseButton type="submit" :loading="submitting">Create tag</BaseButton>
    </div>
  </form>
</template>
