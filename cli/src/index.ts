#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerProjectCommands } from "./commands/projects.js";
import { registerBoardCommands } from "./commands/board.js";
import { registerTaskCommands } from "./commands/tasks.js";
import { registerTagCommands } from "./commands/tags.js";
import { registerSystemCommands } from "./commands/system.js";

const program = new Command();

program
  .name("dt")
  .description("dev-tracker CLI — manage projects, boards, tasks and tags from the terminal")
  .version("1.2.1")
  .option("-u, --url <url>", "API base URL", process.env.DEV_TRACKER_URL ?? "http://localhost:3000")
  .option("--json", "output machine-readable JSON instead of human format", false);

registerAuthCommands(program);
registerProjectCommands(program);
registerBoardCommands(program);
registerTaskCommands(program);
registerTagCommands(program);
registerSystemCommands(program);

function isJsonMode(): boolean {
  return Boolean(program.opts<{ json?: boolean }>().json);
}

program.parseAsync(process.argv).catch((err: unknown) => {
  const json = isJsonMode();
  // ApiError carries our structured hint/code fields — surface them when
  // running in JSON mode so callers can drive remediation automatically.
  if (
    json &&
    err instanceof Error &&
    typeof (err as { status?: unknown }).status === "number"
  ) {
    const apiErr = err as Error & {
      status: number;
      code?: string;
      hint?: string;
      body?: unknown;
    };
    console.log(
      JSON.stringify(
        {
          error: apiErr.message,
          status: apiErr.status,
          code: apiErr.code ?? null,
          hint: apiErr.hint ?? null,
          body: apiErr.body ?? null,
        },
        null,
        2,
      ),
    );
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
