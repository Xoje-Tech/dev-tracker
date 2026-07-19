/**
 * Milestones routes — paths relative to the base mount `/api/projects`.
 *
 * Milestones are nested under projects, so the base mount is `/api/projects`
 * and the item paths include both `:projectId` and `:milestoneId` segments.
 *
 * NOTE: This module is wired in PR D (router mounting in src/app.ts). For now,
 * the routes are exported and exercised directly via the controller — no
 * `app.use()` registration here.
 */
export const MILESTONES_ROUTES = {
  base: "/api/projects",
  collection: "/:projectId/milestones",
  item: "/:projectId/milestones/:milestoneId",
  archive: "/:projectId/milestones/:milestoneId/archive",
} as const;