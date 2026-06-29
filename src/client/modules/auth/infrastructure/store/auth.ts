import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useApi } from "@client/shared/infrastructure/composables/useApi";
import type { LoginCredentials, RegisterData, User } from "@client/auth/domain/types";

/**
 * Auth module — Pinia store (infrastructure layer).
 *
 * Wraps the backend auth endpoints under /api/auth:
 *   POST /register    — create user, returns User
 *   POST /login       — establishes session cookie, returns User
 *   POST /logout      — clears session
 *   GET  /me          — returns current user (401 if no session)
 *
 * Session is cookie-based (express-session), so all requests send
 * credentials: 'include' via the shared useApi wrapper.
 */
export const useAuthStore = defineStore("auth", () => {
  const api = useApi("/api/auth");

  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => user.value !== null);

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      user.value = await api.post<User>("/login", credentials);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Login failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: RegisterData): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      user.value = await api.post<User>("/register", data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Registration failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    loading.value = true;
    try {
      await api.post("/logout");
    } catch {
      // Swallow — logout must always clear local state even if the server call fails.
    } finally {
      user.value = null;
      loading.value = false;
    }
  }

  async function fetchMe(): Promise<void> {
    try {
      user.value = await api.get<User>("/me");
    } catch {
      user.value = null;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    clearError,
  };
});
