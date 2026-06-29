export interface TaskResponseDto {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: string;
  order: number;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}
