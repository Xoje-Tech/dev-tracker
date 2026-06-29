<script setup lang="ts">
import { ref } from "vue";
import BaseButton from "@client/shared/interface/components/atoms/BaseButton.vue";
import AuthField from "@client/auth/interface/components/molecules/AuthField.vue";
import FieldError from "@client/auth/interface/components/atoms/FieldError.vue";
import { useAuthStore } from "@client/auth/infrastructure/store/auth";

const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const formError = ref<string | null>(null);

async function onSubmit(event: Event): Promise<void> {
  event.preventDefault();
  formError.value = null;
  try {
    await authStore.login({ email: email.value, password: password.value });
  } catch (e) {
    formError.value = e instanceof Error ? e.message : "Could not sign in";
  }
}
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <AuthField
      v-model="email"
      id="login-email"
      name="email"
      label="Email"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
    />
    <AuthField
      v-model="password"
      id="login-password"
      name="password"
      label="Password"
      type="password"
      autocomplete="current-password"
      placeholder="••••••••"
    />
    <FieldError :message="formError" />
    <BaseButton type="submit" block :loading="authStore.loading">
      Sign in
    </BaseButton>
  </form>
</template>
