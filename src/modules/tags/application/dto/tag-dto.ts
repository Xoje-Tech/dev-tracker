import { z } from "zod";

export const tagDtoSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export type TagDto = z.infer<typeof tagDtoSchema>;
