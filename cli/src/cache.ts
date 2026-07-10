/**
 * Filesystem cache for the GitHub mirror.
 *
 * Layout: <cwd>/.dev-tracker/sync/<entity-type>/<key>.json
 *
 * Writes are atomic — we stage data in a temp file under the same
 * directory (so the rename is on the same filesystem) and only then
 * rename it over the final path. A reader will therefore never observe
 * a half-written payload. We use the `wx` flag on the tmp write so two
 * concurrent writers in the same process (and thus the same pid) cannot
 * collide on the same intermediate name.
 *
 * Reads return `null` on ENOENT rather than throwing so callers can
 * treat "no cache yet" as a normal, expected state.
 */

import {
  mkdir,
  writeFile,
  rename,
  readFile,
  readdir,
  stat,
} from "node:fs/promises";
import { join } from "node:path";

export type EntityType = "issues" | "prs" | "branches" | "runs";

export function syncRoot(): string {
  return join(process.cwd(), ".dev-tracker", "sync");
}

export async function ensureCacheDir(t: EntityType): Promise<string> {
  const dir = join(syncRoot(), t);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeMirror(
  t: EntityType,
  key: string,
  payload: unknown,
): Promise<void> {
  const dir = await ensureCacheDir(t);
  const target = join(dir, `${key}.json`);
  const tmp = join(dir, `.${key}.json.tmp.${process.pid}`);
  const data = JSON.stringify(payload, null, 2);
  await writeFile(tmp, data, { encoding: "utf8", flag: "wx" });
  await rename(tmp, target);
}

export async function readMirror<T = unknown>(
  t: EntityType,
  key: string,
): Promise<T | null> {
  try {
    const data = await readFile(join(syncRoot(), t, `${key}.json`), "utf8");
    return JSON.parse(data) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function cacheMtime(t: EntityType): Promise<Date | null> {
  try {
    const s = await stat(join(syncRoot(), t));
    return s.mtime;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/**
 * Age in hours of the most-recently written mirror file under
 * `syncRoot()/t`. We use the *file* mtime (not the directory mtime)
 * because the directory's mtime only changes when entries are added
 * or removed — a plain `writeMirror` that adds a new file does bump
 * the directory mtime, but a refresh that *replaces* an existing file
 * leaves it untouched, which would make `cacheAgeHours` always report
 * "as old as the first refresh." Scanning the JSON entries and taking
 * the newest mtime gives a stable "freshness of the latest refresh"
 * semantic regardless of whether the refresh was a new key or an
 * overwrite of an existing one.
 */
export async function cacheAgeHours(t: EntityType): Promise<number | null> {
  const dir = join(syncRoot(), t);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  const jsonFiles = entries.filter((f) => f.endsWith(".json"));
  if (jsonFiles.length === 0) return null;
  let newestMs = 0;
  for (const f of jsonFiles) {
    const s = await stat(join(dir, f));
    if (s.mtime.getTime() > newestMs) newestMs = s.mtime.getTime();
  }
  if (newestMs === 0) return null;
  return (Date.now() - newestMs) / 3_600_000;
}
