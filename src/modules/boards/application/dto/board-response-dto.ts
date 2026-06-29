export interface BoardResponseDto {
  id: string;
  projectId: string;
  columns: {
    id: string;
    title: string;
    order: number;
  }[];
}
