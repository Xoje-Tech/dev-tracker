/**
 * Output formatting — pretty human or machine JSON.
 *
 * The --json flag is read off the root program in main(). We accept it
 * via a parameter to keep the helpers pure and easy to test.
 */

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
