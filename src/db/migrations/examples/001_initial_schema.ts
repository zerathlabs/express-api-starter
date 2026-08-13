/*
 * EXAMPLE: Kysely TypeScript Migration Pattern
 * You can reference this example if you ever want to write migrations using Kysely's TS Schema Builder.
 */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable("users")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("name", "varchar(255)", (col) => col.notNull())
		.addColumn("email", "varchar(255)", (col) => col.notNull().unique())
		.addColumn("created_at", "timestamp", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable("users").execute();
}
