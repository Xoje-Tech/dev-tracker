import { z } from "zod";

export const moveTaskDtoSchema = z.object({
  targetColumnId: z.string().min(1),
  targetOrder: z.number().int().nonnegative(),
});

export type MoveTaskDto = z.infer<typeof moveTaskDtoSchema>;
