<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <aside class="w-60 shrink-0 border-r border-slate-200 bg-white">
      <div class="flex h-14 items-center border-b border-slate-200 px-4">
        <span class="text-lg font-semibold tracking-tight text-slate-900">
          Dev Tracker
        </span>
      </div>
      <nav class="space-y-1 p-2">
        <RouterLink
          to="/projects"
          class="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          active-class="bg-slate-100 text-slate-900"
        >
          Projects
        </RouterLink>
        <RouterLink
          to="/tags"
          class="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          active-class="bg-slate-100 text-slate-900"
        >
          Tags
        </RouterLink>
      </nav>
    </aside>
    <div class="flex flex-1 flex-col">
      <header
        class="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-6"
      >
        <slot name="topbar" />
      </header>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
