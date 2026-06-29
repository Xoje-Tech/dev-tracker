<script setup lang="ts">
import AuthLayout from "@client/auth/interface/components/templates/AuthLayout.vue";
import AuthCard from "@client/auth/interface/components/organisms/AuthCard.vue";
import LoginForm from "@client/auth/interface/components/molecules/LoginForm.vue";
</script>

<template>
  <AuthLayout>
    <AuthCard
      title="Sign in to Dev Tracker"
      subtitle="Manage your projects and tasks"
    >
      <LoginForm />
    </AuthCard>
  </AuthLayout>
</template>
