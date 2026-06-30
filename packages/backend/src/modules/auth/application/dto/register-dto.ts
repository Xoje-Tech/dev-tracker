import { z } from "zod";

export const registerDtoSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

export type RegisterDto = z.infer<typeof registerDtoSchema>;
