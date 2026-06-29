<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "default" | "success" | "warning" | "danger" | "info";
  }>(),
  { variant: "default" },
);
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="
      variant === 'success'
        ? 'bg-emerald-100 text-emerald-700'
        : variant === 'warning'
          ? 'bg-amber-100 text-amber-700'
          : variant === 'danger'
            ? 'bg-red-100 text-red-700'
            : variant === 'info'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-slate-100 text-slate-700'
    "
  >
    <slot />
  </span>
</template>
