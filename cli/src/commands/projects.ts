import { Command } from "commander";
import { ApiClient } from "../client.js";
import { loadSession } from "../session.js";
import { jsonOut, success, table, useJson } from "../output.js";

interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

function client(program: Command): ApiClient {
  return new ApiClient(program.opts<{ url: string }>().url);
}
function requireAuth(): void {
  // The server will 401 if there's no session; this is a soft check.
  // We keep it simple: no client-side gating.
  void loadSession;
}

export function registerProjectCommands(program: Command): void {
  const projects = program
    .command("projects")
    .alias("p")
    .description("Project commands");

  projects
    .command("list")
    .alias("ls")
    .description("List all projects")
    .action(async () => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const rows = await api.get<ProjectDto[]>("/api/projects");
      if (json) jsonOut(rows);
      else table(rows.map((p) => ({
        id: p.id.slice(0, 8),
        name: p.name,
        role: p.role,
        archived: p.archived ? "yes" : "",
        description: p.description ?? "",
      })), ["id", "name", "role", "archived", "description"]);
    });

  projects
    .command("get <id>")
    .description("Get one project by id")
    .action(async (id: string) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const p = await api.get<ProjectDto>(`/api/projects/${id}`);
      if (json) jsonOut(p);
      else {
        console.log(`${p.name} [${p.role}]${p.archived ? " (archived)" : ""}`);
        if (p.description) console.log(`  ${p.description}`);
        console.log(`  id: ${p.id}`);
      }
    });

  projects
    .command("create")
    .description("Create a new project")
    .requiredOption("--name <name>")
    .option("--description <desc>", "optional description (max 500 chars)")
    .action(async (opts: { name: string; description?: string }) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const body: { name: string; description?: string } = { name: opts.name };
      if (opts.description) body.description = opts.description;
      const p = await api.post<ProjectDto>("/api/projects", body);
      success(`Created project ${p.id} "${p.name}"`, json, p);
    });

  projects
    .command("archive <id>")
    .description("Archive a project (soft delete)")
    .action(async (id: string) => {
      requireAuth();
      const json = useJson(program);
      const api = client(program);
      const p = await api.post<ProjectDto>(`/api/projects/${id}/archive`);
      success(`Archived project ${p.id} "${p.name}"`, json, p);
    });
}
