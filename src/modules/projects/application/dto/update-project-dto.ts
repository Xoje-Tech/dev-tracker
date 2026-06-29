import { z } from "zod";

export const updateProjectDtoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export type UpdateProjectDto = z.infer<typeof updateProjectDtoSchema>;
