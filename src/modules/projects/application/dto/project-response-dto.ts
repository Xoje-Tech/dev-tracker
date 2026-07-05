export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}
