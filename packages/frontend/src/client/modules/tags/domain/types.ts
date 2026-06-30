/**
 * Tags module — domain types.
 * Mirrors backend src/modules/tags/application/dto/tag-response-dto.ts.
 */

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CreateTagInput {
  name: string;
  color: string;
}
