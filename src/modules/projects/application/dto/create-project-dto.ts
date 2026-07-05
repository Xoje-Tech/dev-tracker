import { z } from "zod";

export const createProjectDtoSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  repoUrl: z.string().url().max(2000).nullable().optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectDtoSchema>;
