<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { z } from "zod";
import { storeToRefs } from "pinia";
import BaseModal from "@client/shared/interface/components/atoms/BaseModal.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";
import BaseTextarea from "@client/shared/interface/components/atoms/BaseTextarea.vue";
import BaseSelect from "@client/shared/interface/components/atoms/BaseSelect.vue";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import { useMilestonesStore } from "@client/milestones/infrastructure/store/milestones";
import type {
  CreateSprintInput,
  Sprint,
  UpdateSprintInput,
} from "@client/sprints/domain/types";

export type DialogKind = "closed" | "create" | "edit";

const props = defineProps<{
  open: boolean;
  kind: DialogKind;
  projectId: string;
  sprint?: Sprint | null;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "submit",
    payload:
      | { kind: "create"; input: CreateSprintInput }
      | { kind: "update"; input: UpdateSprintInput },
  ): void;
}>();

const milestonesStore = useMilestonesStore();
const { milestones } = storeToRefs(milestonesStore);

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  milestoneId: z.string().nullable(),
});

type FormState = {
  name: string;
  description: string;
  milestoneId: string; // "" for none, otherwise the milestone id
};

const state = reactive<FormState>({
  name: "",
  description: "",
  milestoneId: "",
});

const errors = reactive<{
  name?: string;
  description?: string;
  milestoneId?: string;
}>({});

const milestoneOptions = computed(() => [
  { value: "", label: "(none)" },
  ...milestones.value.map((m) => ({
    value: m.id,
    label: m.title,
  })),
]);

watch(
  () => [props.open, props.kind, props.sprint?.id],
  () => {
    if (!props.open) return;
    // Ensure milestones are loaded for the select.
    if (milestones.value.length === 0) {
      void milestonesStore.fetchAll(props.projectId);
    }
    if (props.kind === "edit" && props.sprint) {
      state.name = props.sprint.name;
      state.description = props.sprint.description ?? "";
      state.milestoneId = props.sprint.milestoneId ?? "";
    } else {
      state.name = "";
      state.description = "";
      state.milestoneId = "";
    }
    errors.name = undefined;
    errors.description = undefined;
    errors.milestoneId = undefined;
  },
  { immediate: true },
);

const title = computed(() =>
  props.kind === "edit"
    ? `Edit sprint: ${props.sprint?.name ?? ""}`
    : "New sprint",
);

function handleSubmit(): void {
  const result = schema.safeParse({
    name: state.name,
    description: state.description.trim() || null,
    milestoneId: state.milestoneId || null,
  });

  if (!result.success) {
    errors.name = undefined;
    errors.description = undefined;
    errors.milestoneId = undefined;
    for (const issue of result.error.issues) {
      const path = issue.path[0];
      if (path === "name") errors.name = issue.message;
      else if (path === "description") errors.description = issue.message;
      else if (path === "milestoneId") errors.milestoneId = issue.message;
    }
    return;
  }

  errors.name = undefined;
  errors.description = undefined;
  errors.milestoneId = undefined;

  const parsed = result.data;
  const milestoneId = parsed.milestoneId; // already null when empty

  if (props.kind === "create") {
    emit("submit", {
      kind: "create",
      input: {
        name: parsed.name,
        description: parsed.description ?? null,
        milestoneId,
      },
    });
    return;
  }

  // edit — only include fields that actually changed.
  const input: UpdateSprintInput = {};
  if (props.sprint?.name !== parsed.name) input.name = parsed.name;
  if ((props.sprint?.description ?? null) !== (parsed.description ?? null)) {
    input.description = parsed.description ?? null;
  }
  if ((props.sprint?.milestoneId ?? null) !== milestoneId) {
    input.milestoneId = milestoneId;
  }
  emit("submit", { kind: "update", input });
}
</script>

<template>
  <BaseModal :open="open" :title="title" size="md" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <FormField label="Name" :error="errors.name" required html-for="sp-name">
        <BaseInput
          id="sp-name"
          v-model="state.name"
          placeholder="e.g. Sprint Alpha"
          :disabled="busy"
        />
      </FormField>

      <FormField
        label="Description"
        :error="errors.description"
        html-for="sp-desc"
      >
        <BaseTextarea
          id="sp-desc"
          v-model="state.description"
          :rows="3"
          placeholder="Optional details"
          :disabled="busy"
        />
      </FormField>

      <FormField
        label="Milestone"
        :error="errors.milestoneId"
        html-for="sp-milestone"
      >
        <BaseSelect
          id="sp-milestone"
          v-model="state.milestoneId"
          :options="milestoneOptions"
          :disabled="busy"
        />
      </FormField>

      <div class="flex items-center justify-end gap-2 pt-2">
        <BaseButton
          type="button"
          variant="ghost"
          :disabled="busy"
          @click="emit('close')"
        >
          Cancel
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="busy">
          {{ kind === "edit" ? "Save changes" : "Create sprint" }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>