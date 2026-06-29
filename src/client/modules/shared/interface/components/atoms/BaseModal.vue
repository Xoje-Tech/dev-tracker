<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    size?: "sm" | "md" | "lg";
  }>(),
  { size: "md" },
);

defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="$emit('close')"
      >
        <div
          role="dialog"
          aria-modal="true"
          class="w-full rounded-lg bg-white shadow-xl"
          :class="size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'"
        >
          <header class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
            <button
              type="button"
              class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Close"
              @click="$emit('close')"
            >
              ×
            </button>
          </header>
          <div class="p-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
