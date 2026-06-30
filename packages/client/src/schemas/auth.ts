/**
 * Zod schemas for the 5 auth endpoints.
 *
 * Input schemas are the source of truth for the wire contract. The
 * backend has matching DTOs (kept in sync manually) — F2 does not
 * re-import from @dev-tracker/backend to keep the client package
 * independent and the typecheck hermetic. Unification is a follow-up.
 */
import { z } from "zod";

export const registerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

// No body for logout, me, rotateApiKey — empty object sentinel.
export const emptyInputSchema = z.object({}).strict();
export type EmptyInput = z.infer<typeof emptyInputSchema>;

// userOutput covers register, login, me.
export const userOutputSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  apiKey: z.string().nullable(),
});
export type UserOutput = z.infer<typeof userOutputSchema>;

export const logoutOutputSchema = z.object({
  message: z.string(),
});
export type LogoutOutput = z.infer<typeof logoutOutputSchema>;

export const rotateApiKeyOutputSchema = z.object({
  apiKey: z.string(),
});
export type RotateApiKeyOutput = z.infer<typeof rotateApiKeyOutputSchema>;
