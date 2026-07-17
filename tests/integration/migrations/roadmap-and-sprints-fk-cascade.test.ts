import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_SUFFIX = "_roadmap_and_sprints";

async function loadRoadmapMigrationSql(clauseName: string): Promise<string> {
  const migrationsDirectory = resolve(process.cwd(), "prisma", "migrations");
  const entries = await readdir(migrationsDirectory, { withFileTypes: true }).catch(
    () => [],
  );
  const migration = entries.find(
    (entry) => entry.isDirectory() && entry.name.endsWith(MIGRATION_SUFFIX),
  );

  if (!migration) {
    throw new Error(`Missing migration SQL for clause: ${clauseName}`);
  }

  return readFile(join(migrationsDirectory, migration.name, "migration.sql"), "utf8");
}

describe("roadmap and sprints migration foreign-key contract", () => {
  it("declares Milestone(projectId) -> Project(id) ON DELETE CASCADE", async () => {
    const clause = "Milestone(projectId) -> Project(id) ON DELETE CASCADE";
    const sql = await loadRoadmapMigrationSql(clause);

    expect(
      sql,
      `Missing FK clause: ${clause}`,
    ).toMatch(
      /CONSTRAINT\s+"Milestone_projectId_fkey"\s+FOREIGN KEY\s*\("projectId"\)\s+REFERENCES\s+"Project"\s*\("id"\)\s+ON DELETE CASCADE/i,
    );
  });

  it("declares Sprint(projectId) -> Project(id) ON DELETE CASCADE", async () => {
    const clause = "Sprint(projectId) -> Project(id) ON DELETE CASCADE";
    const sql = await loadRoadmapMigrationSql(clause);

    expect(
      sql,
      `Missing FK clause: ${clause}`,
    ).toMatch(
      /CONSTRAINT\s+"Sprint_projectId_fkey"\s+FOREIGN KEY\s*\("projectId"\)\s+REFERENCES\s+"Project"\s*\("id"\)\s+ON DELETE CASCADE/i,
    );
  });

  it("declares Task(sprintId) -> Sprint(id) ON DELETE SET NULL", async () => {
    const clause = "Task(sprintId) -> Sprint(id) ON DELETE SET NULL";
    const sql = await loadRoadmapMigrationSql(clause);

    expect(
      sql,
      `Missing FK clause: ${clause}`,
    ).toMatch(
      /CONSTRAINT\s+"Task_sprintId_fkey"\s+FOREIGN KEY\s*\("sprintId"\)\s+REFERENCES\s+"Sprint"\s*\("id"\)\s+ON DELETE SET NULL/i,
    );
  });
});
