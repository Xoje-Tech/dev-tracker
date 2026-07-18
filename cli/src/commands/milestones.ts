import { Command } from "commander";
import { ApiClient } from "../client.js";
import { loadSession } from "../session.js";
import { jsonOut, success, table, useJson } from "../output.js";

interface MilestoneDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function client(program: Command): ApiClient {
  return new ApiClient(program.opts<{ url: string }>().url);
}
function requireAuth(): void {
  // Server enforces auth; this keeps the pattern consistent with
  // sibling commands. No client-side gating.
  void loadSession;
}

export function registerMilestoneCommands(program: Command): void {
  const milestones = program
    .command("milestones")
    .alias("ms")
    .description("Milestone commands");

  milestones
    .command("list")
    .alias("ls")
    .description("List milestones for a project")
    .requiredOption("--project <projectId>", "parent project id")
    .option("--include-archived", "include archived milestones")
    .action(async (opts: { project: string; includeArchived?: boolean }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const qs = opts.includeArchived ? "?includeArchived=true" : "";
      const rows = await api.get<MilestoneDto[]>(
        `/api/projects/${opts.project}/milestones${qs}`,
      );
      if (json) {
        jsonOut(rows);
      } else {
        table(
          rows.map((m) => ({
            id: m.id.slice(0, 8),
            title: m.title,
            status: m.status,
            due: m.dueDate ?? "",
          })),
          ["id", "title", "status", "due"],
        );
      }
    });

  milestones
    .command("get <milestoneId>")
    .description("Get a single milestone by id")
    .requiredOption("--project <projectId>", "parent project id")
    .action(async (milestoneId: string, opts: { project: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const m = await api.get<MilestoneDto>(
        `/api/projects/${opts.project}/milestones/${milestoneId}`,
      );
      if (json) {
        jsonOut(m);
      } else {
        console.log(`${m.title} [${m.status}]`);
        if (m.description) console.log(`  ${m.description}`);
        if (m.dueDate) console.log(`  due: ${m.dueDate}`);
        console.log(`  id: ${m.id}`);
      }
    });

  milestones
    .command("create")
    .description("Create a milestone")
    .requiredOption("--project <projectId>", "parent project id")
    .requiredOption("--title <title>", "milestone title (1-120 chars)")
    .option("--description <desc>", "optional description (max 2000 chars)")
    .option("--due-date <iso>", "optional ISO 8601 due date")
    .action(
      async (opts: {
        project: string;
        title: string;
        description?: string;
        dueDate?: string;
      }) => {
        requireAuth();
        const json = useJson(program);
        const api = client(program);
        const body: Record<string, unknown> = { title: opts.title };
        if (opts.description) body.description = opts.description;
        if (opts.dueDate) body.dueDate = opts.dueDate;
        const m = await api.post<MilestoneDto>(
          `/api/projects/${opts.project}/milestones`,
          body,
        );
        success(`Created milestone ${m.id} "${m.title}"`, json, m);
      },
    );

  milestones
    .command("update <milestoneId>")
    .description("Update a milestone")
    .requiredOption("--project <projectId>", "parent project id")
    .option("--title <title>", "new title")
    .option("--description <desc>", "new description")
    .option("--due-date <iso>", "new ISO 8601 due date")
    .option("--status <status>", "new status: open | closed | archived")
    .action(
      async (
        milestoneId: string,
        opts: {
          project: string;
          title?: string;
          description?: string;
          dueDate?: string;
          status?: string;
        },
      ) => {
        requireAuth();
        const json = useJson(program);
        const api = client(program);
        const body: Record<string, unknown> = {};
        if (opts.title !== undefined) body.title = opts.title;
        if (opts.description !== undefined) body.description = opts.description;
        if (opts.dueDate !== undefined) body.dueDate = opts.dueDate;
        if (opts.status !== undefined) body.status = opts.status;
        const m = await api.patch<MilestoneDto>(
          `/api/projects/${opts.project}/milestones/${milestoneId}`,
          body,
        );
        success(`Updated milestone ${m.id}`, json, m);
      },
    );

  milestones
    .command("delete <milestoneId>")
    .description("Hard-delete a milestone (sprints.milestoneId -> null)")
    .requiredOption("--project <projectId>", "parent project id")
    .action(async (milestoneId: string, opts: { project: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      await api.del(
        `/api/projects/${opts.project}/milestones/${milestoneId}`,
      );
      success(
        `Deleted milestone ${milestoneId}`,
        json,
        { id: milestoneId, deleted: true },
      );
    });

  milestones
    .command("archive <milestoneId>")
    .description("Soft-archive a milestone (status -> archived)")
    .requiredOption("--project <projectId>", "parent project id")
    .action(async (milestoneId: string, opts: { project: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const m = await api.post<MilestoneDto>(
        `/api/projects/${opts.project}/milestones/${milestoneId}/archive`,
      );
      success(`Archived milestone ${m.id} "${m.title}"`, json, m);
    });
}