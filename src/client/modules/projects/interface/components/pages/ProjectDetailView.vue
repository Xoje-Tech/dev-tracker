<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthenticatedLayout from "@client/auth/interface/components/templates/AuthenticatedLayout.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import BaseBadge from "@client/shared/interface/components/atoms/BaseBadge.vue";
import BaseSpinner from "@client/shared/interface/components/atoms/BaseSpinner.vue";
import PageHeader from "@client/shared/interface/components/molecules/PageHeader.vue";
import FormField from "@client/shared/interface/components/molecules/FormField.vue";
import { useProjectsStore } from "@client/projects/infrastructure/store/projects";
import { useBoardStore } from "@client/board/infrastructure/store/board";

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const boardStore = useBoardStore();

const id = String(route.params.id);

const isEditing = ref(false);
const editName = ref("");
const editDescription = ref("");
const editRepoUrl = ref("");

const project = computed(() => projectsStore.current);
const board = computed(() => boardStore.board);

onMounted(async () => {
  await projectsStore.fetchOne(id);
  await boardStore.fetchBoard(id);
  await projectsStore.fetchMemories(id);
  initializeForm();
});

function initializeForm(): void {
  if (projectsStore.current) {
    editName.value = projectsStore.current.name;
    editDescription.value = projectsStore.current.description ?? "";
    editRepoUrl.value = projectsStore.current.repoUrl ?? "";
  }
}

watch(() => projectsStore.current, () => {
  initializeForm();
});

// Calculate statistics
const boardStats = computed(() => {
  if (!board.value) return { total: 0, done: 0, percentage: 0, columns: [] };
  
  const columns = board.value.columns.map(col => ({
    title: col.title,
    count: col.tasks.length
  }));
  
  const total = board.value.columns.reduce((sum, col) => sum + col.tasks.length, 0);
  
  // Find Done column
  const doneCol = board.value.columns.find(
    col => col.title.toLowerCase() === "done" || col.title.toLowerCase() === "done/finished"
  );
  const done = doneCol ? doneCol.tasks.length : 0;
  
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  
  return { total, done, percentage, columns };
});

async function handleUpdate(): Promise<void> {
  try {
    await projectsStore.update(id, {
      name: editName.value,
      description: editDescription.value || null,
      repoUrl: editRepoUrl.value || null,
    });
    isEditing.value = false;
  } catch (e) {
    console.error("Failed to update project", e);
  }
}

async function handleArchive(): Promise<void> {
  if (confirm("Are you sure you want to archive this project?")) {
    try {
      await projectsStore.archive(id);
      void router.push("/projects");
    } catch (e) {
      console.error("Failed to archive project", e);
    }
  }
}

function cancelEdit(): void {
  initializeForm();
  isEditing.value = false;
}
</script>

<template>
  <AuthenticatedLayout>
    <div v-if="projectsStore.loading && !project" class="flex h-64 items-center justify-center">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="project" class="space-y-6">
      <!-- Page Header -->
      <PageHeader :title="project.name" :subtitle="project.archived ? 'Archived Project' : 'Active Project'">
        <template #actions>
          <div class="flex items-center gap-2">
            <BaseButton variant="secondary" @click="router.push('/projects')">
              Back to List
            </BaseButton>
            <BaseButton @click="router.push({ name: 'board', params: { id } })">
              Go to Kanban Board ➡️
            </BaseButton>
          </div>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main details section (2 cols) -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Description and metadata card -->
          <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 class="text-lg font-semibold text-slate-900">Project Information</h2>
              <BaseButton 
                v-if="!isEditing" 
                variant="secondary" 
                size="sm" 
                @click="isEditing = true"
              >
                Edit Details
              </BaseButton>
            </div>

            <!-- Read mode -->
            <div v-if="!isEditing" class="mt-4 space-y-4">
              <div>
                <span class="text-xs uppercase tracking-wider text-slate-400 font-medium">Description</span>
                <p v-if="project.description" class="mt-1 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {{ project.description }}
                </p>
                <p v-else class="mt-1 text-sm italic text-slate-400">
                  No description provided yet. Click edit to add one.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-50">
                <div>
                  <span class="text-xs uppercase tracking-wider text-slate-400 font-medium">Git Repository</span>
                  <div class="mt-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    <a 
                      v-if="project.repoUrl" 
                      :href="project.repoUrl" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {{ project.repoUrl }}
                    </a>
                    <span v-else class="text-sm italic text-slate-400">No repo link</span>
                  </div>
                </div>

                <div>
                  <span class="text-xs uppercase tracking-wider text-slate-400 font-medium">Your Role</span>
                  <div class="mt-1">
                    <BaseBadge variant="info">{{ project.role.toUpperCase() }}</BaseBadge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit mode -->
            <form v-else @submit.prevent="handleUpdate" class="mt-4 space-y-4">
              <FormField 
                id="edit-name" 
                label="Project Name" 
                v-model="editName" 
                required 
              />
              <FormField 
                id="edit-repo" 
                label="Git Repository URL" 
                v-model="editRepoUrl" 
                placeholder="https://github.com/owner/repo"
              />
              
              <div class="flex flex-col gap-1">
                <label for="edit-desc" class="text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  id="edit-desc"
                  v-model="editDescription"
                  rows="4"
                  class="rounded-md border border-slate-200 p-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tell us what this project is about..."
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <BaseButton type="button" variant="secondary" @click="cancelEdit">
                  Cancel
                </BaseButton>
                <BaseButton type="submit" :loading="projectsStore.loading">
                  Save Changes
                </BaseButton>
              </div>
            </form>
          </div>

          <!-- Documentation & Hitos Placeholder -->
          <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">Activity & Integration</h2>
            <div class="mt-4 space-y-4">
              <div class="flex gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  🧬
                </div>
                <div class="space-y-0.5">
                  <p class="text-sm font-medium text-slate-800">Unified local database setup</p>
                  <p class="text-xs text-slate-500">Express API fallback is active for local development and CLI coordination.</p>
                </div>
              </div>

              <div class="flex gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  🔧
                </div>
                <div class="space-y-0.5">
                  <p class="text-sm font-medium text-slate-800">Command line ready</p>
                  <p class="text-xs text-slate-500">Run <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-pink-600">dt board get {{ project.id.slice(0, 8) }}</code> to explore columns from your terminal.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Engram Memory Bank Card -->
          <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
                🧠 Engram Memory Bank
                <span class="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 font-bold">
                  {{ projectsStore.memories.length }}
                </span>
              </h2>
              <span v-if="projectsStore.memoriesWarning" class="text-xs text-amber-600 italic">
                ⚠️ {{ projectsStore.memoriesWarning }}
              </span>
            </div>

            <!-- List of observations -->
            <div v-if="projectsStore.memories.length > 0" class="mt-4 divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              <div 
                v-for="obs in projectsStore.memories" 
                :key="obs.id"
                class="py-4 first:pt-0 last:pb-0"
              >
                <div class="flex items-start justify-between gap-3">
                  <h3 class="text-sm font-semibold text-slate-800 leading-snug">
                    {{ obs.title }}
                  </h3>
                  <BaseBadge 
                    :variant="
                      obs.type === 'decision'
                        ? 'info'
                        : obs.type === 'architecture'
                          ? 'default'
                          : obs.type === 'bugfix'
                            ? 'danger'
                            : 'success'
                    "
                  >
                    {{ obs.type.toUpperCase() }}
                  </BaseBadge>
                </div>
                
                <!-- Structured Content -->
                <p class="mt-2 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {{ obs.content }}
                </p>
                
                <div class="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Session: {{ obs.session_id }}</span>
                  <span>{{ new Date(obs.created_at).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="mt-4 text-center py-6">
              <p class="text-sm text-slate-500">No memories registered in Engram for this project yet.</p>
              <p class="text-xs text-slate-400 mt-1 leading-relaxed max-w-md mx-auto">
                As AI agents implement features or bugfixes using specs, learnings are saved autonomously into your persistent Engram network.
              </p>
            </div>
          </div>
        </div>

        <!-- Sidebar metrics card (1 col) -->
        <div class="space-y-6">
          <!-- Statistics card -->
          <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">Sprint Progress</h2>
            
            <div class="mt-4 space-y-6">
              <!-- Circular/Bar progress indicator -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-slate-700">Completion</span>
                  <span class="font-bold text-slate-900">{{ boardStats.percentage }}%</span>
                </div>
                <!-- Progress bar -->
                <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    class="h-full bg-blue-600 transition-all duration-500" 
                    :style="{ width: `${boardStats.percentage}%` }"
                  ></div>
                </div>
                <p class="text-xs text-slate-400">
                  {{ boardStats.done }} of {{ boardStats.total }} tasks completed
                </p>
              </div>

              <!-- Columns list breakdown -->
              <div class="space-y-3 pt-4 border-t border-slate-50">
                <h3 class="text-xs uppercase tracking-wider text-slate-400 font-medium">Board Columns</h3>
                <div v-if="boardStats.columns.length > 0" class="space-y-2">
                  <div 
                    v-for="col in boardStats.columns" 
                    :key="col.title"
                    class="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span class="font-medium text-slate-700">{{ col.title }}</span>
                    <span class="font-bold text-slate-900">{{ col.count }}</span>
                  </div>
                </div>
                <p v-else class="text-sm italic text-slate-400">
                  Tablero vacío o no inicializado.
                </p>
              </div>
            </div>
          </div>

          <!-- Danger zone card -->
          <div class="rounded-lg border border-red-200 bg-red-50/50 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-red-900 border-b border-red-100 pb-4">Danger Zone</h2>
            <div class="mt-4 space-y-4">
              <p class="text-xs text-slate-500 leading-normal">
                Archiving a project soft-deletes it. It can still be retrieved via API but won't be displayed in your active grid.
              </p>
              <BaseButton 
                variant="danger" 
                block 
                @click="handleArchive"
              >
                Archive Project
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="text-center py-12">
      <p class="text-lg text-slate-500 font-medium">Project not found 😢</p>
      <BaseButton class="mt-4" @click="router.push('/projects')">
        Back to Projects
      </BaseButton>
    </div>
  </AuthenticatedLayout>
</template>
