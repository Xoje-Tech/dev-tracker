/**
 * Tags routes — paths relative to the base mount `/api/tags`.
 *
 * Tag operations span two collections: the global tag list and the
 * per-task assignment. Both share the same base mount.
 */
export const TAGS_ROUTES = {
  base: '/api/tags',
  collection: '/tags',
  attach: '/tasks/:taskId/tags/:tagId',
  detach: '/tasks/:taskId/tags/:tagId',
} as const;