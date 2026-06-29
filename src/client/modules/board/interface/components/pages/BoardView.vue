<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import AuthenticatedLayout from "@client/auth/interface/components/templates/AuthenticatedLayout.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseModal from "@client/shared/interface/components/atoms/BaseModal.vue";
import BaseSpinner from "@client/shared/interface/components/atoms/BaseSpinner.vue";
import EmptyState from "@client/shared/interface/components/molecules/EmptyState.vue";
import PageHeader from "@client/shared/interface/components/molecules/PageHeader.vue";
import KanbanBoard from "@client/board/interface/components/organisms/KanbanBoard.vue";
import TaskForm from "@client/board/interface/components/molecules/TaskForm.vue";
import { useBoardStore } from "@client/board/infrastructure/store/board";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";
import type { BoardTask, Priority } from "@client/board/domain/types";

const route = useRoute();
const router = useRouter();
const boardStore = useBoardStore();
const projectsStore = useProjectsStore();

const projectId = computed(() => String(route.params.id));
const project = computed(() =>
  projectsStore.projects.find((p) => p.id === projectId.value) ?? null,
);

type DialogState =
  | { kind: "closed" }
  | { kind: "create"; columnId: string }
  | { kind: "edit"; task: BoardTask };

const dialog = ref<DialogState>({ kind: "closed" });
const dialogBusy = ref(false);
const dialogError = ref<string | null>(null);

onMounted(async () => {
  if (projectsStore.projects.length === 0) {
    await projectsStore.fetchAll();
  }
  await boardStore.fetchBoard(projectId.value);
});

function openCreate(columnId: string): void {
  dialog.value = { kind: "create", columnId };
  dialogError.value = null;
}

function openEdit(task: BoardTask): void {
  dialog.value = { kind: "edit", task };
  dialogError.value = null;
}

function closeDialog(): void {
  dialog.value = { kind: "closed" };
  dialogError.value = null;
}

async function onDialogSubmit(payload: {
  title: string;
  description: string | null;
  priority: Priority;
}): Promise<void> {
  if (dialog.value.kind !== "create" && dialog.value.kind !== "edit") return;
  dialogBusy.value = true;
  dialogError.value = null;
  try {
    if (dialog.value.kind === "create") {
      await boardStore.createTask({
        columnId: dialog.value.columnId,
        title: payload.title,
        description: payload.description ?? undefined,
        priority: payload.priority,
      });
    } else {
      await boardStore.updateTask(dialog.value.task.id, {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
      });
    }
    closeDialog();
  } catch (e) {
    dialogError.value = e instanceof Error ? e.message : "Could not save task";
  } finally {
    dialogBusy.value = false;
  }
}

async function onDelete(task: BoardTask): Promise<void> {
  if (!window.confirm(`Delete "${task.title}"?`)) return;
  try {
    await boardStore.deleteTask(task.id);
  } catch (e) {
    window.alert(e instanceof Error ? e.message : "Could not delete task");
  }
}

async function onMove(payload: {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  newIndex: number;
}): Promise<void> {
  try {
    await boardStore.moveTask(payload.taskId, payload.fromColumnId, {
      targetColumnId: payload.toColumnId,
      newIndex: payload.newIndex,
    });
  } catch (e) {
    window.alert(e instanceof Error ? e.message : "Could not move task");
    await boardStore.fetchBoard(projectId.value);
  }
}

function backToProjects(): void {
  void router.push({ name: "projects" });
}
</script>

<template>
  <AuthenticatedLayout>
    <PageHeader
      :title="project?.name ?? 'Board'"
      :subtitle="project?.description ?? undefined"
    >
      <template #actions>
        <BaseButton variant="secondary" @click="backToProjects">Back to projects</BaseButton>
      </template>
    </PageHeader>

    <div v-if="boardStore.loading" class="flex items-center gap-2 text-sm text-slate-500">
      <BaseSpinner size="sm" /> Loading board…
    </div>

    <p v-else-if="boardStore.error" class="text-sm text-red-600" role="alert">
      {{ boardStore.error }}
    </p>

    <EmptyState
      v-else-if="!boardStore.board || boardStore.board.columns.length === 0"
      title="No columns yet"
      description="The board has no columns. Set up the kanban first."
    />

    <KanbanBoard
      v-else
      :board="boardStore.board"
      @add-task="openCreate"
      @edit-task="openEdit"
      @delete-task="onDelete"
      @move-task="onMove"
    />

    <BaseModal
      :open="dialog.kind !== 'closed'"
      :title="dialog.kind === 'edit' ? 'Edit task' : 'New task'"
      size="md"
      @close="closeDialog"
    >
      <p v-if="dialogError" class="mb-3 text-sm text-red-600" role="alert">
        {{ dialogError }}
      </p>
      <TaskForm
        v-if="dialog.kind === 'edit'"
        :initial-title="dialog.task.title"
        :initial-description="dialog.task.description"
        :initial-priority="dialog.task.priority"
        submit-label="Save changes"
        :busy="dialogBusy"
        @submit="onDialogSubmit"
        @cancel="closeDialog"
      />
      <TaskForm
        v-else-if="dialog.kind === 'create'"
        submit-label="Create task"
        :busy="dialogBusy"
        @submit="onDialogSubmit"
        @cancel="closeDialog"
      />
    </BaseModal>

    <p class="mt-6">
      <RouterLink to="/projects" class="text-sm text-slate-500 hover:text-slate-700">
        ← All projects
      </RouterLink>
    </p>
  </AuthenticatedLayout>
</template>
