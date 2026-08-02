/**
 * Board routes — paths relative to the base mount `/api/projects`.
 *
 * Boards are nested under projects, so the base mount is `/api/projects/:projectId/board`
 * and the item paths are relative to that (typically just `/`).
 */
export const BOARD_ROUTES = {
  /**
   * Mount point used in `app.use(...)`.
   * Mounted as a singleton sub-resource of a project.
   */
  base: '/api/projects/:projectId/board',

  /** GET /api/projects/:projectId/board */
  get: '/',

  /** POST /api/projects/:projectId/board */
  createDefault: '/',
} as const;
