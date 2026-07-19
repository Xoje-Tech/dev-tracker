/**
 * Tasks routes — paths relative to the base mount `/api/tasks`.
 */
export const TASKS_ROUTES = {
  base: '/api/tasks',
  collection: '/',
  item: '/:id',
  move: '/:id/move',
} as const;