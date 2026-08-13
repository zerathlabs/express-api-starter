import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { env } from "@/env.js";
import type { Database } from "./types.js";

// PostgreSQL Dialect (Default)
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
  }),
});

/*
 * To switch to Oracle Database:
 * 1. Install Oracle driver & dialect: `pnpm add oracledb kysely-oracledb`
 * 2. Replace PostgresDialect with OracleDialect:
 *
 * import { OracleDialect } from "kysely-oracledb";
 * import oracledb from "oracledb";
 *
 * const dialect = new OracleDialect({
 *   pool: await oracledb.createPool({
 *     connectString: env.DATABASE_URL,
 *     user: process.env.DB_USER,
 *     password: process.env.DB_PASSWORD,
 *   }),
 * });
 */

export const db = new Kysely<Database>({
  dialect,
});
