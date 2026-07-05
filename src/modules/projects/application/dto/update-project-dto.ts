import { z } from "zod";

export const updateProjectDtoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  repoUrl: z.string().url().max(2000).nullable().optional(),
});

export type UpdateProjectDto = z.infer<typeof updateProjectDtoSchema>;
