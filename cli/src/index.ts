#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerProjectCommands } from "./commands/projects.js";
import { registerBoardCommands } from "./commands/board.js";
import { registerTaskCommands } from "./commands/tasks.js";
import { registerTagCommands } from "./commands/tags.js";

const program = new Command();

program
  .name("dt")
  .description("dev-tracker CLI — manage projects, boards, tasks and tags from the terminal")
  .version("0.1.0")
  .option("-u, --url <url>", "API base URL", process.env.DEV_TRACKER_URL ?? "http://localhost:3000")
  .option("--json", "output machine-readable JSON instead of human format", false);

registerAuthCommands(program);
registerProjectCommands(program);
registerBoardCommands(program);
registerTaskCommands(program);
registerTagCommands(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
