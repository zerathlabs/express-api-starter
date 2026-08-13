import type { TaskTable, UserTable } from "./tables/index.js";

export interface Database {
  user: UserTable;
  task: TaskTable;
}

export type * from "./tables/index.js";
