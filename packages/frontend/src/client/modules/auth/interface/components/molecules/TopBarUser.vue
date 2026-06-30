<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@client/auth/infrastructure/store/auth";
import BaseAvatar from "@client/shared/interface/components/atoms/BaseAvatar.vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";

const auth = useAuthStore();
const router = useRouter();

async function handleLogout(): Promise<void> {
  await auth.logout();
  router.push("/login");
}
</script>

<template>
  <div v-if="auth.user" class="flex items-center gap-3">
    <BaseAvatar :name="auth.user.name" size="sm" />
    <span class="text-sm font-medium text-slate-700">{{ auth.user.name }}</span>
    <BaseButton variant="secondary" @click="handleLogout">Log out</BaseButton>
  </div>
</template>
