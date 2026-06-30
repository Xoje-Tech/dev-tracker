<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import AuthLayout from "@client/auth/interface/components/templates/AuthLayout.vue";
import AuthCard from "@client/auth/interface/components/organisms/AuthCard.vue";
import LoginForm from "@client/auth/interface/components/molecules/LoginForm.vue";
import LoginBanner from "@client/auth/interface/components/molecules/LoginBanner.vue";

const route = useRoute();

// Banner reason precedence: route.query.reason (set by the auth-guard for
// expired sessions) > local ref (set when the login form reports bad creds).
const localReason = ref<string | null>(null);
const bannerReason = computed<string | null>(() => {
  const fromQuery = typeof route.query.reason === "string" ? route.query.reason : null;
  return localReason.value ?? fromQuery;
});

function onInvalidCredentials(): void {
  localReason.value = "invalid_credentials";
}
</script>

<template>
  <AuthLayout>
    <AuthCard
      title="Sign in to Dev Tracker"
      subtitle="Manage your projects and tasks"
    >
      <LoginBanner :reason="bannerReason" />
      <LoginForm @invalid-credentials="onInvalidCredentials" />
    </AuthCard>
  </AuthLayout>
</template>