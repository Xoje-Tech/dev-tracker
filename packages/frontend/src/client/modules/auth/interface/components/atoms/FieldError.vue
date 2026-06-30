<script setup lang="ts">
defineProps<{
  message: string | null;
}>();
</script>

<template>
  <p v-if="message" class="text-sm text-red-600" role="alert">{{ message }}</p>
</template>
