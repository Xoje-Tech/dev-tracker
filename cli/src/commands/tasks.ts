import { Command } from "commander";
import { ApiClient } from "../client.js";
import { jsonOut, success, useJson } from "../output.js";

interface TaskDto {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  order: number;
  assigneeId: string | null;
  creatorId: string;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

function client(program: Command): ApiClient {
  return new ApiClient(program.opts<{ url: string }>().url);
}

export function registerTaskCommands(program: Command): void {
  const tasks = program
    .command("tasks")
    .alias("t")
    .description("Task commands");

  tasks
    .command("create")
    .description("Create a task in a column")
    .requiredOption("--column <columnId>")
    .requiredOption("--title <title>")
    .option("--description <text>")
    .option("--priority <p>", "low | medium | high", "medium")
    .requiredOption("--order <n>", "position index", Number)
    .action(
      async (opts: {
        column: string;
        title: string;
        description?: string;
        priority?: string;
        order: number;
      }) => {
        const json = useJson(program);
        const api = client(program);
        const body: Record<string, unknown> = {
          columnId: opts.column,
          title: opts.title,
          priority: opts.priority ?? "medium",
          order: opts.order,
        };
        if (opts.description) body.description = opts.description;
        const t = await api.post<TaskDto>("/api/", body);
        success(`Created task ${t.id} "${t.title}"`, json, t);
      },
    );

  tasks
    .command("update <id>")
    .description("Update a task's title, description, or priority")
    .option("--title <title>")
    .option("--description <text>")
    .option("--priority <p>", "low | medium | high")
    .action(
      async (
        id: string,
        opts: { title?: string; description?: string; priority?: string },
      ) => {
        const json = useJson(program);
        const api = client(program);
        const body: Record<string, unknown> = {};
        if (opts.title !== undefined) body.title = opts.title;
        if (opts.description !== undefined) body.description = opts.description;
        if (opts.priority !== undefined) body.priority = opts.priority;
        const t = await api.patch<TaskDto>(`/api/tasks/${id}`, body);
        success(`Updated task ${t.id}`, json, t);
      },
    );

  tasks
    .command("move <id>")
    .description("Move a task to a different column and/or position")
    .requiredOption("--to-column <columnId>")
    .requiredOption("--to-index <n>", "new index in the target column (0-based)", (v) => Number(v))
    .action(async (id: string, opts: { toColumn: string; toIndex: number }) => {
      const json = useJson(program);
      const api = client(program);
      await api.post(`/api/tasks/${id}/move`, {
        targetColumnId: opts.toColumn,
        newIndex: opts.toIndex,
      });
      success(`Moved task ${id} to column ${opts.toColumn} at index ${opts.toIndex}`, json);
    });

  tasks
    .command("delete <id>")
    .description("Delete a task")
    .action(async (id: string) => {
      const json = useJson(program);
      const api = client(program);
      await api.del(`/api/tasks/${id}`);
      success(`Deleted task ${id}`, json);
    });

  // Keep jsonOut reachable for future list/get tasks commands.
  void jsonOut;
}
