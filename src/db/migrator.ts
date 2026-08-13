import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "kysely";
import { db } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationTable() {
	await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `.execute(db);
}

export async function runMigrations() {
	await ensureMigrationTable();

	const files = await fs.readdir(MIGRATIONS_DIR);
	const upFiles = files.filter((f) => f.endsWith(".up.sql")).sort();

	const appliedRows = await sql<{ name: string }>`
    SELECT name FROM _migrations ORDER BY name ASC
  `.execute(db);

	const appliedNames = new Set(appliedRows.rows.map((r) => r.name));
	let appliedCount = 0;

	for (const file of upFiles) {
		const migrationName = file.replace(".up.sql", "");
		if (!appliedNames.has(migrationName)) {
			console.log(`[DB Migration] Applying migration: "${migrationName}"...`);
			const filePath = path.join(MIGRATIONS_DIR, file);
			const sqlContent = await fs.readFile(filePath, "utf-8");

			if (sqlContent.trim()) {
				await sql.raw(sqlContent).execute(db);
			}

			await sql`
        INSERT INTO _migrations (name) VALUES (${migrationName})
      `.execute(db);

			console.log(`[DB Migration] Successfully applied: "${migrationName}"`);
			appliedCount++;
		}
	}

	if (appliedCount === 0) {
		console.log("[DB Migration] No pending migrations.");
	} else {
		console.log(`[DB Migration] Total migrations applied: ${appliedCount}`);
	}
}

export async function rollbackMigration() {
	await ensureMigrationTable();

	const appliedRows = await sql<{ name: string }>`
    SELECT name FROM _migrations ORDER BY executed_at DESC, name DESC LIMIT 1
  `.execute(db);

	if (appliedRows.rows.length === 0) {
		console.log("[DB Migration] No migrations to roll back.");
		return;
	}

	const lastMigration = appliedRows.rows[0]?.name;
	if (!lastMigration) return;

	const downFileName = `${lastMigration}.down.sql`;
	const downFilePath = path.join(MIGRATIONS_DIR, downFileName);

	console.log(`[DB Migration] Rolling back migration: "${lastMigration}"...`);

	try {
		const sqlContent = await fs.readFile(downFilePath, "utf-8");
		if (sqlContent.trim()) {
			await sql.raw(sqlContent).execute(db);
		}

		await sql`
      DELETE FROM _migrations WHERE name = ${lastMigration}
    `.execute(db);

		console.log(`[DB Migration] Successfully rolled back: "${lastMigration}"`);
	} catch (err) {
		console.error(
			`[DB Migration] Rollback failed for "${lastMigration}":`,
			err,
		);
		throw err;
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
			console.error("[DB Migration] Error executing migrations:", err);
			await db.destroy();
			process.exit(1);
		});
}
