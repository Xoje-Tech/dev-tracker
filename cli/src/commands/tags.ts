import { Command } from "commander";
import { ApiClient } from "../client.js";
import { jsonOut, success, table } from "../output.js";

interface TagDto {
  id: string;
  name: string;
  color: string;
}

function client(program: Command): ApiClient {
  return new ApiClient(program.opts<{ url: string }>().url);
}
function useJson(program: Command): boolean {
  return Boolean(program.opts<{ json?: boolean }>().json);
}

export function registerTagCommands(program: Command): void {
  const tags = program
    .command("tags")
    .alias("g")
    .description("Tag commands");

  tags
    .command("list")
    .alias("ls")
    .description("List all tags")
    .action(async () => {
      const json = useJson(program);
      const api = client(program);
      const rows = await api.get<TagDto[]>("/api/tags");
      if (json) jsonOut(rows);
      else table(rows.map((t) => ({ id: t.id.slice(0, 8), name: t.name, color: t.color })), ["id", "name", "color"]);
    });

  tags
    .command("create")
    .description("Create a tag")
    .requiredOption("--name <name>")
    .requiredOption("--color <hex>", "hex color like #ef4444")
    .action(async (opts: { name: string; color: string }) => {
      const json = useJson(program);
      const api = client(program);
      const t = await api.post<TagDto>("/api/tags", { name: opts.name, color: opts.color });
      success(`Created tag ${t.id} "${t.name}"`, json, t);
    });

  // URLs use the new mount-prefix convention (see issue #41):
  // /api/tags/tasks/:taskId/tags/:tagId
  tags
    .command("assign <taskId> <tagId>")
    .description("Assign a tag to a task")
    .action(async (taskId: string, tagId: string) => {
      const json = useJson(program);
      const api = client(program);
      await api.post(`/api/tags/tasks/${taskId}/tags/${tagId}`);
      success(`Assigned tag ${tagId} to task ${taskId}`, json);
    });

  tags
    .command("unassign <taskId> <tagId>")
    .description("Remove a tag from a task")
    .action(async (taskId: string, tagId: string) => {
      const json = useJson(program);
      const api = client(program);
      await api.del(`/api/tags/tasks/${taskId}/tags/${tagId}`);
      success(`Removed tag ${tagId} from task ${taskId}`, json);
    });
}
