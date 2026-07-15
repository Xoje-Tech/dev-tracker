/**
 * Board routes — paths relative to the base mount `/api/projects`.
 *
 * Boards are nested under projects (one board per project), so the
 * base mount is `/api/projects` and the item paths include the
 * `:projectId` segment.
 */
export const BOARD_ROUTES = {
  base: '/api/boards',
  get: '/:projectId/board',
  createDefault: '/:projectId/board',
} as const;