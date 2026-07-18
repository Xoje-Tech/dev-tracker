<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { z } from "zod";
import BaseModal from "@client/shared/interface/components/atoms/BaseModal.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";
import BaseTextarea from "@client/shared/interface/components/atoms/BaseTextarea.vue";
import BaseSelect from "@client/shared/interface/components/atoms/BaseSelect.vue";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import {
  MILESTONE_STATUS_OPTIONS,
  type CreateMilestoneInput,
  type Milestone,
  type MilestoneStatus,
  type UpdateMilestoneInput,
} from "@client/milestones/domain/types";

export type DialogKind = "closed" | "create" | "edit";

const props = defineProps<{
  open: boolean;
  kind: DialogKind;
  milestone?: Milestone | null;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "submit",
    payload:
      | { kind: "create"; input: CreateMilestoneInput }
      | { kind: "update"; input: UpdateMilestoneInput },
  ): void;
}>();

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().nullable(),
  status: z.enum(["open", "closed", "archived"]),
});

type FormState = {
  title: string;
  description: string;
  dueDate: string; // HTML datetime-local format: YYYY-MM-DDTHH:mm or ""
  status: MilestoneStatus;
};

const state = reactive<FormState>({
  title: "",
  description: "",
  dueDate: "",
  status: "open",
});

const errors = reactive<{ title?: string; description?: string; dueDate?: string }>(
  {},
);

watch(
  () => [props.open, props.kind, props.milestone?.id],
  () => {
    if (!props.open) return;
    if (props.kind === "edit" && props.milestone) {
      state.title = props.milestone.title;
      state.description = props.milestone.description ?? "";
      state.dueDate = htmlDateTimeLocal(props.milestone.dueDate);
      state.status = props.milestone.status;
    } else {
      state.title = "";
      state.description = "";
      state.dueDate = "";
      state.status = "open";
    }
    errors.title = undefined;
    errors.description = undefined;
    errors.dueDate = undefined;
  },
  { immediate: true },
);

const title = computed(() =>
  props.kind === "edit"
    ? `Edit milestone: ${props.milestone?.title ?? ""}`
    : "New milestone",
);

function htmlDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // YYYY-MM-DDTHH:mm in LOCAL time (matches <input type="datetime-local">)
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(local: string): string | null {
  if (!local) return null;
  const d = new Date(local); // interprets as local time
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function handleSubmit(): void {
  const result = schema.safeParse({
    title: state.title,
    description: state.description.trim() || null,
    dueDate: state.dueDate || null,
    status: state.status,
  });

  if (!result.success) {
    errors.title = undefined;
    errors.description = undefined;
    errors.dueDate = undefined;
    for (const issue of result.error.issues) {
      const path = issue.path[0];
      if (path === "title") errors.title = issue.message;
      else if (path === "description") errors.description = issue.message;
      else if (path === "dueDate") errors.dueDate = issue.message;
    }
    return;
  }

  errors.title = undefined;
  errors.description = undefined;
  errors.dueDate = undefined;

  const parsed = result.data;
  const dueDate = toIsoFromLocal(parsed.dueDate ?? "");

  if (props.kind === "create") {
    emit("submit", {
      kind: "create",
      input: {
        title: parsed.title,
        description: parsed.description ?? null,
        dueDate,
      },
    });
    return;
  }

  // edit — only include fields that actually changed.
  const input: UpdateMilestoneInput = {};
  if (props.milestone?.title !== parsed.title) input.title = parsed.title;
  if ((props.milestone?.description ?? null) !== (parsed.description ?? null)) {
    input.description = parsed.description ?? null;
  }
  if ((props.milestone?.dueDate ?? null) !== dueDate) {
    input.dueDate = dueDate;
  }
  if (props.milestone && props.milestone.status !== parsed.status) {
    input.status = parsed.status;
  }
  emit("submit", { kind: "update", input });
}
</script>

<template>
  <BaseModal :open="open" :title="title" size="md" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <FormField label="Title" :error="errors.title" required html-for="ms-title">
        <BaseInput
          id="ms-title"
          v-model="state.title"
          placeholder="e.g. Alpha release"
          :disabled="busy"
        />
      </FormField>

      <FormField
        label="Description"
        :error="errors.description"
        html-for="ms-desc"
      >
        <BaseTextarea
          id="ms-desc"
          v-model="state.description"
          :rows="3"
          placeholder="Optional details"
          :disabled="busy"
        />
      </FormField>

      <FormField label="Due date" :error="errors.dueDate" html-for="ms-due">
        <input
          id="ms-due"
          v-model="state.dueDate"
          type="datetime-local"
          class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100"
          :disabled="busy"
        />
      </FormField>

      <FormField
        v-if="kind === 'edit'"
        label="Status"
        html-for="ms-status"
      >
        <BaseSelect
          id="ms-status"
          v-model="state.status"
          :options="MILESTONE_STATUS_OPTIONS"
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
          {{ kind === "edit" ? "Save changes" : "Create milestone" }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>