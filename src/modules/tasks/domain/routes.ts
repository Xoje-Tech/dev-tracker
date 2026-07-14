/**
 * Tasks routes — paths relative to the base mount `/api/tasks`.
 */
export const TASKS_ROUTES = {
  base: '/api/tasks',
  collection: '/tasks',
  item: '/tasks/:id',
  move: '/tasks/:id/move',
} as const;