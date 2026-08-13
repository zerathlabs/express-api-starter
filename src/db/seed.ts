import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "kysely";
import { Logger } from "@/utils/logger/index.js";
import { db } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSeed() {
  Logger.info("[DB Seed] Running database seeding...");
  const seedPath = path.join(__dirname, "seeds", "seed.sql");

  try {
    const seedSql = await fs.readFile(seedPath, "utf-8");
    if (seedSql.trim()) {
      await sql.raw(seedSql).execute(db);
      Logger.info("[DB Seed] Seeding executed successfully!");
    } else {
      Logger.info("[DB Seed] Seed file is empty, skipping.");
    }
  } catch (err) {
    Logger.error("[DB Seed] Failed to run seed:", err);
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
      Logger.error("[DB Seed] Error executing seed:", err);
      await db.destroy();
      process.exit(1);
    });
}
