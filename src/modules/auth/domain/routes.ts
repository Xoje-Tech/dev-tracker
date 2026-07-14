/**
 * Auth routes — single source of truth.
 */
export const AUTH_ROUTES = {
  base: '/api/auth',
  register: '/register',
  login: '/login',
  logout: '/logout',
  me: '/me',
  rotateApiKey: '/rotate-api-key',
} as const;