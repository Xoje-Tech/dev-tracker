/**
 * Project routes — single source of truth for all paths the projects module exposes.
 *
 * Each entry is the path RELATIVE to the base mount. The router registers
 * the same paths. This object is the contract both sides must agree on;
 * see `projects-routes.test.ts` for the binding assertion.
 */
export const PROJECTS_ROUTES = {
  /** Mount point used in `app.use(...)` */
  base: '/api/projects',
  /** Path inside the router for list/create */
  collection: '/',
  /** Path inside the router for get/update/archive/memories */
  item: '/:id',
  /** Path for the Engram memories proxy under a project */
  memories: '/:id/memories',
  /** Path for archive action (POST instead of PATCH to make the action explicit) */
  archive: '/:id/archive',
} as const;