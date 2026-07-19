/**
 * Sprint routes — paths relative to the base mount `/api/projects`.
 *
 * Sprints are nested under projects, so the base mount is `/api/projects`
 * and the item paths include both `:projectId` and `:sprintId` segments.
 *
 * Mirrors the structure of `milestones/domain/routes.ts` so the frontend
 * can import the constants via the `@sprints` alias.
 */
export const SPRINTS_ROUTES = {
  base: "/api/projects",
  collection: "/:projectId/sprints",
  item: "/:projectId/sprints/:sprintId",
} as const;