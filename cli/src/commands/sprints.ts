import { Command } from "commander";
import { ApiClient } from "../client.js";
import { loadSession } from "../session.js";
import { jsonOut, success, table, useJson } from "../output.js";

interface SprintDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
}

function client(program: Command): ApiClient {
  return new ApiClient(program.opts<{ url: string }>().url);
}
function requireAuth(): void {
  void loadSession;
}

/**
 * Resolve --milestone-id option for sprint update. The literal string
 * "null" is the user's signal to detach the sprint from its milestone,
 * matching the REST contract where PATCH milestoneId=null clears the FK.
 */
function resolveMilestoneId(
  raw: string | undefined,
  includeKey: boolean,
): { include: boolean; value: string | null } {
  if (!includeKey) return { include: false, value: null };
  if (raw === "null") return { include: true, value: null };
  return { include: true, value: raw! };
}

export function registerSprintCommands(program: Command): void {
  const sprints = program
    .command("sprints")
    .alias("sp")
    .description("Sprint commands");

  sprints
    .command("list")
    .alias("ls")
    .description("List sprints for a project")
    .requiredOption("--project <projectId>", "parent project id")
    .action(async (opts: { project: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const rows = await api.get<SprintDto[]>(
        `/api/projects/${opts.project}/sprints`,
      );
      if (json) {
        jsonOut(rows);
      } else {
        table(
          rows.map((s) => ({
            id: s.id.slice(0, 8),
            name: s.name,
            milestone: s.milestoneId ? s.milestoneId.slice(0, 8) : "(none)",
          })),
          ["id", "name", "milestone"],
        );
      }
    });

  sprints
    .command("get <sprintId>")
    .description("Get a single sprint by id")
    .requiredOption("--project <projectId>", "parent project id")
    .action(async (sprintId: string, opts: { project: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const s = await api.get<SprintDto>(
        `/api/projects/${opts.project}/sprints/${sprintId}`,
      );
      if (json) {
        jsonOut(s);
      } else {
        console.log(`${s.name}`);
        if (s.description) console.log(`  ${s.description}`);
        console.log(
          `  milestone: ${s.milestoneId ? s.milestoneId : "(none)"}`,
        );
        console.log(`  id: ${s.id}`);
      }
    });

  sprints
    .command("create")
    .description("Create a sprint")
    .requiredOption("--project <projectId>", "parent project id")
    .requiredOption("--name <name>", "sprint name (1-120 chars)")
    .option("--description <desc>", "optional description")
    .option(
      "--milestone-id <id|null>",
      "attach to a milestone in the same project; pass literal 'null' to leave detached",
    )
    .action(
      async (opts: {
        project: string;
        name: string;
        description?: string;
        milestoneId?: string;
      }) => {
        requireAuth();
        const json = useJson(program);
        const api = client(program);
        const body: Record<string, unknown> = { name: opts.name };
        if (opts.description) body.description = opts.description;
        const mid = resolveMilestoneId(opts.milestoneId, opts.milestoneId !== undefined);
        if (mid.include) body.milestoneId = mid.value;
        const s = await api.post<SprintDto>(
          `/api/projects/${opts.project}/sprints`,
          body,
        );
        success(`Created sprint ${s.id} "${s.name}"`, json, s);
      },
    );

  sprints
    .command("update <sprintId>")
    .description("Update a sprint (name or milestone attachment)")
    .requiredOption("--project <projectId>", "parent project id")
    .option("--name <name>", "new sprint name")
    .option("--description <desc>", "new description")
    .option(
      "--milestone-id <id|null>",
      "attach to a milestone, or pass literal 'null' to detach",
    )
    .action(
      async (
        sprintId: string,
        opts: {
          project: string;
          name?: string;
          description?: string;
          milestoneId?: string;
        },
      ) => {
        requireAuth();
        const json = useJson(program);
        const api = client(program);
        const body: Record<string, unknown> = {};
        if (opts.name !== undefined) body.name = opts.name;
        if (opts.description !== undefined) body.description = opts.description;
        // milestone-id needs special handling: explicit detach vs unchanged
        const mid = resolveMilestoneId(opts.milestoneId, opts.milestoneId !== undefined);
        if (mid.include) body.milestoneId = mid.value;
        const s = await api.patch<SprintDto>(
          `/api/projects/${opts.project}/sprints/${sprintId}`,
          body,
        );
        success(`Updated sprint ${s.id}`, json, s);
      },
    );

  sprints
    .command("delete <sprintId>")
    .description("Hard-delete a sprint (tasks.sprintId -> null)")
    .requiredOption("--project <projectId>", "parent project id")
    .action(async (sprintId: string, opts: { project: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      await api.del(`/api/projects/${opts.project}/sprints/${sprintId}`);
      success(`Deleted sprint ${sprintId}`, json, {
        id: sprintId,
        deleted: true,
      });
    });
}