<script setup lang="ts">
import AppLayout from "@client/shared/interface/components/templates/AppLayout.vue";
import TopBarUser from "@client/auth/interface/components/molecules/TopBarUser.vue";
</script>

<template>
  <AppLayout>
    <template #topbar>
      <TopBarUser />
    </template>
    <slot />
  </AppLayout>
</template>
