import type { UserTable } from "./tables/users.js";

export interface Database {
	users: UserTable;
}

export * from "./tables/users.js";
