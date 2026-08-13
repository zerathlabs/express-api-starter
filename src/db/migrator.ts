import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileMigrationProvider, Migrator } from "kysely";
import { Logger } from "@/utils/logger/index.js";
import { db } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, "migrations"),
  }),
});

export async function runMigrations() {
  Logger.info("[DB Migration] Running pending migrations...");

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      Logger.info(`[DB Migration] Applied: "${it.migrationName}"`);
    } else if (it.status === "Error") {
      Logger.error(`[DB Migration] Failed: "${it.migrationName}"`);
    }
  });

  if (error) {
    Logger.error("[DB Migration] Migration failed", error);
    throw error;
  }

  if (!results?.length) {
    Logger.info("[DB Migration] No pending migrations.");
  }
}

export async function rollbackMigration() {
  Logger.info("[DB Migration] Rolling back last migration...");

  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === "Success") {
      Logger.info(`[DB Migration] Rolled back: "${it.migrationName}"`);
    } else if (it.status === "Error") {
      Logger.error(`[DB Migration] Rollback failed: "${it.migrationName}"`);
    }
  });

  if (error) {
    Logger.error("[DB Migration] Rollback failed", error);
    throw error;
  }
}

// Allow direct CLI execution: `pnpm run db:migrate` or `pnpm run db:migrate:down`
if (process.argv[1]?.endsWith("migrator.ts")) {
  const action = process.argv[2] ?? "latest";
  const runner = action === "down" ? rollbackMigration : runMigrations;

  runner()
    .then(async () => {
      await db.destroy();
      process.exit(0);
    })
    .catch(async (err) => {
      Logger.error("[DB Migration] Error executing migrations:", err);
      await db.destroy();
      process.exit(1);
    });
}
