import { Command } from "commander";
import { ApiClient } from "../client.js";
import { jsonOut, success, table } from "../output.js";

interface BoardTaskDto {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  order: number;
  assigneeId: string | null;
  tagIds: string[];
  createdAt: string;
}
interface BoardColumnDto {
  id: string;
  title: string;
  order: number;
  tasks: BoardTaskDto[];
}
interface BoardDto {
  id: string;
  projectId: string;
  columns: BoardColumnDto[];
}

function client(program: Command): ApiClient {
  return new ApiClient(program.opts<{ url: string }>().url);
}
function useJson(program: Command): boolean {
  return Boolean(program.opts<{ json?: boolean }>().json);
}

export function registerBoardCommands(program: Command): void {
  const board = program
    .command("board")
    .alias("b")
    .description("Board commands");

  board
    .command("get <projectId>")
    .description("Fetch the kanban board for a project")
    .action(async (projectId: string) => {
      const json = useJson(program);
      const api = client(program);
      const b = await api.get<BoardDto>(`/api/projects/${projectId}/board`);
      if (json) {
        jsonOut(b);
        return;
      }
      console.log(`Board ${b.id} (project ${b.projectId})`);
      for (const col of b.columns) {
        console.log(`\n[${col.title}] (${col.tasks.length})`);
        if (col.tasks.length === 0) {
          console.log("  (empty)");
        } else {
          for (const t of col.tasks) {
            const tags = t.tagIds.length > 0 ? ` ${t.tagIds.map((id) => `[#${id.slice(0, 6)}]`).join(" ")}` : "";
            console.log(`  - ${t.title} [${t.priority}]${tags}`);
          }
        }
      }
    });

  board
    .command("init <projectId>")
    .description("Create the default board for a project (if missing)")
    .action(async (projectId: string) => {
      const json = useJson(program);
      const api = client(program);
      const b = await api.post<BoardDto>(`/api/projects/${projectId}/board`);
      success(`Board ${b.id} initialized`, json, b);
    });

  // Reference table() so it isn't tree-shaken before any future
  // listing command uses it.
  void table;
}
