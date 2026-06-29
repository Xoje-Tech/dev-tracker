import { z } from "zod";

export const authResponseDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  apiKey: z.string().nullable(),
});

export type AuthResponseDto = z.infer<typeof authResponseDtoSchema>;

export function toAuthResponseDto(user: {
  id: string;
  email: string;
  name: string;
  apiKey: string | null;
}): AuthResponseDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    apiKey: user.apiKey,
  };
}
