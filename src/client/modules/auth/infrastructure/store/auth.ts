import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useApi } from "@client/shared/infrastructure/composables/useApi";
import type { ApiError } from "@client/shared/infrastructure/composables/useApi";
import type { LoginCredentials, RegisterData, User } from "@client/auth/domain/types";

/**
 * Discriminated reason for the most recent fetchMe() outcome.
 *
 *   - 'expired'    : 401 — the session cookie was missing or expired
 *   - 'network'    : fetch threw (offline, DNS, 5xx, etc.)
 *   - 'auth_error' : 4xx other than 401 (e.g. malformed token)
 *   - null         : fetchMe either succeeded or has not run yet
 *
 * Used by the auth-guard to decide whether to add ?reason=session_expired
 * on the /login redirect.
 */
export type FetchMeErrorReason = "expired" | "network" | "auth_error";

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
  const lastErrorReason = ref<FetchMeErrorReason | null>(null);

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
      lastErrorReason.value = null;
    } catch (e) {
      user.value = null;
      // Discriminate: 401 = session expired (cookie missing/expired),
      // 5xx / fetch-thrown = network, other 4xx = auth_error.
      const apiErr = e as ApiError;
      if (apiErr && typeof apiErr.status === "number") {
        if (apiErr.status === 401) {
          lastErrorReason.value = "expired";
        } else if (apiErr.status >= 500) {
          lastErrorReason.value = "network";
        } else {
          lastErrorReason.value = "auth_error";
        }
      } else {
        // Fetch itself threw (TypeError on network failure, AbortError, etc.)
        lastErrorReason.value = "network";
      }
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    user,
    loading,
    error,
    lastErrorReason,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    clearError,
  };
});
