/**
 * Board routes — paths relative to the base mount `/api/boards`.
 *
 * Boards are keyed by project id (one board per project), so the item
 * paths use `:projectId` as the resource identifier under `/api/boards`.
 */
export const BOARD_ROUTES = {
  base: '/api/boards',
  get: '/:projectId/board',
  createDefault: '/:projectId/board',
} as const;
