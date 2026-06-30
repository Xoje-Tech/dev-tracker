<script setup lang="ts">
import { computed } from "vue";

/**
 * LoginBanner — molecule that renders a context-appropriate notice
 * above the login form. Receives a `reason` prop (string | null) and
 * renders nothing when reason is null/empty/unknown. Used by LoginView
 * to surface:
 *
 *   - 'session_expired'     : warning — guard redirected because /me 401'd
 *   - 'invalid_credentials' : error   — login form just rejected the user
 *
 * Unknown reasons render nothing rather than throw, so future
 * reason codes can be added safely.
 */
const props = defineProps<{
  reason?: string | null;
}>();

interface BannerContent {
  text: string;
  variant: "warning" | "error";
}

const content = computed<BannerContent | null>(() => {
  if (props.reason === "session_expired") {
    return {
      text: "Tu sesión expiró. Volvé a iniciar sesión.",
      variant: "warning",
    };
  }
  if (props.reason === "invalid_credentials") {
    return {
      text: "Email o contraseña incorrectos.",
      variant: "error",
    };
  }
  return null;
});
</script>

<template>
  <div
    v-if="content"
    role="alert"
    class="mb-4 rounded-md border px-3 py-2 text-sm"
    :class="
      content.variant === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-red-200 bg-red-50 text-red-700'
    "
  >
    {{ content.text }}
  </div>
</template>