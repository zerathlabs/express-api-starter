import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(255) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
		)
	`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS users`.execute(db);
}
