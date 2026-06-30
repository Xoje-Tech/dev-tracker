/**
 * Auth module — domain types.
 *
 * Mirrors the backend AuthResponseDto (see src/modules/auth/application/dto/auth-response-dto.ts)
 * — keep these in sync if the backend shape changes.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  apiKey: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}
