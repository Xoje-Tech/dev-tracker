<script setup lang="ts">
import { RouterLink } from "vue-router";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p class="text-sm font-semibold text-slate-500">404</p>
    <h1 class="mt-2 text-3xl font-semibold text-slate-900">Page not found</h1>
    <p class="mt-2 text-sm text-slate-500">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <RouterLink to="/projects" class="mt-6">
      <BaseButton variant="primary">Back to projects</BaseButton>
    </RouterLink>
  </div>
</template>
