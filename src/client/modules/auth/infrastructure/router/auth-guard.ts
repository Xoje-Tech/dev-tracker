import { useAuthStore } from "@client/auth/infrastructure/store/auth";
import type { NavigationGuard } from "vue-router";

/**
 * Auth router guard — redirects based on session state.
 *
 * Rules:
 *   - Routes with meta.requiresAuth: redirect to /login if not authed
 *   - Routes with meta.guestOnly: redirect to /projects if authed
 *     (used for /login so a logged-in user doesn't see it again)
 *   - Other routes: pass through
 *
 * On first hit, calls /api/auth/me to confirm the session cookie is
 * still valid. If it 401s, the store records lastErrorReason='expired'
 * and the guard passes ?reason=session_expired to the login view so it
 * can show a friendly banner instead of the bare login screen.
 */
export const authGuard: NavigationGuard = async (to) => {
  const auth = useAuthStore();

  if (auth.user === null) {
    await auth.fetchMe();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    const query: Record<string, string> = { redirect: to.fullPath };
    if (auth.lastErrorReason === "expired") {
      query.reason = "session_expired";
    }
    return { name: "login", query };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "projects" };
  }

  return true;
};
