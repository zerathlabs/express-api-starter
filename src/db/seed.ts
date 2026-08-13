import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "kysely";
import { db } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSeed() {
	console.log("[DB Seed] Running database seeding...");
	const seedPath = path.join(__dirname, "seeds", "seed.sql");

	try {
		const seedSql = await fs.readFile(seedPath, "utf-8");
		if (seedSql.trim()) {
			await sql.raw(seedSql).execute(db);
			console.log("[DB Seed] Seeding executed successfully!");
		} else {
			console.log("[DB Seed] Seed file is empty, skipping.");
		}
	} catch (err) {
		console.error("[DB Seed] Failed to run seed:", err);
		throw err;
	}
}

// Allow direct execution via CLI
if (process.argv[1]?.endsWith("seed.ts")) {
	runSeed()
		.then(async () => {
			await db.destroy();
			process.exit(0);
		})
		.catch(async (err) => {
			console.error(err);
			await db.destroy();
			process.exit(1);
		});
}
