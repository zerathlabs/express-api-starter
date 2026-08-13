import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileMigrationProvider, Migrator } from "kysely";
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

async function run() {
	const action = process.argv[2] ?? "latest";

	console.log(`[DB Migration] Running migration action: "${action}"...`);

	const { error, results } =
		action === "down"
			? await migrator.migrateDown()
			: await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(
				`[DB Migration] Migration "${it.migrationName}" was executed successfully`,
			);
		} else if (it.status === "Error") {
			console.error(
				`[DB Migration] Failed to execute migration "${it.migrationName}"`,
			);
		}
	});

	if (error) {
		console.error("[DB Migration] Failed to migrate:", error);
		process.exit(1);
	}

	await db.destroy();
	console.log("[DB Migration] Done!");
}

run().catch(async (err) => {
	console.error("[DB Migration] Unhandled error:", err);
	await db.destroy();
	process.exit(1);
});
