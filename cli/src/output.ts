/**
 * Output formatting — pretty human or machine JSON.
 *
 * The --json flag is read off the root program in main(). We accept it
 * via a parameter to keep the helpers pure and easy to test.
 */

import { Command } from "commander";

export function jsonOut(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function table(rows: Record<string, unknown>[], columns?: string[]): void {
  if (rows.length === 0) {
    console.log("(no rows)");
    return;
  }
  const keys = columns ?? Object.keys(rows[0]!);
  // Compute widths
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)),
  );
  // Header
  console.log(keys.map((k, i) => k.padEnd(widths[i]!)).join("  "));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  // Rows
  for (const row of rows) {
    console.log(
      keys
        .map((k, i) => String(row[k] ?? "").padEnd(widths[i]!))
        .join("  "),
    );
  }
}

export function success(msg: string, json: boolean, data?: unknown): void {
  if (json && data !== undefined) {
    jsonOut(data);
  } else if (json) {
    jsonOut({ ok: true, message: msg });
  } else {
    console.log(msg);
  }
}

/**
 * Resolve the root program and check the --json flag.
 * Subcommands receive their own Command instance via register*Commands(program),
 * but program.parent points back to root.
 /** Resolve the root program and check the --json flag. */
 export function useJson(program: Command): boolean {
   const root = program.parent ?? program;
   return Boolean(root.opts<{ json?: boolean }>().json);
 }

 /**
  * Machine-readable output mode: true if --json is set OR stdout is not a TTY.
  *
  * Set DT_FORCE_HUMAN=1 to disable the TTY auto-detection (useful for
  * piping a TTY's output through a pager, etc.).
  */
 export function isMachineMode(program?: Command): boolean {
   if (program && useJson(program)) return true;
   if (process.env.DT_FORCE_HUMAN === "1") return false;
   return !process.stdout.isTTY;
 }

 /** Write to stderr in human mode, suppress in machine mode. */
 export function humanStderr(line: string): void {
   if (!process.stdout.isTTY || process.env.DT_FORCE_HUMAN !== "1") {
     // In machine mode, send diagnostics to stderr; consumers can
     // choose to ignore them. We still emit so the human running the
     // command by hand can see something went wrong.
   }
   console.error(line);
 }
