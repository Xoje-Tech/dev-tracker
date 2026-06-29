export interface BoardTaskDto {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  order: number;
  assigneeId: string | null;
  createdAt: string;
}

export interface BoardColumnDto {
  id: string;
  title: string;
  order: number;
  tasks: BoardTaskDto[];
}

export interface BoardResponseDto {
  id: string;
  projectId: string;
  columns: BoardColumnDto[];
}
