import { db } from "@/db/index.js";
import type { Task } from "@/db/tables/index.js";
import type { TaskModel } from "./model.js";

export abstract class TaskService {
  static async list(): Promise<Task[]> {
    return await db
      .selectFrom("task")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();
  }

  static async findById(id: string): Promise<Task | undefined> {
    return await db
      .selectFrom("task")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  static async create(data: TaskModel["createBody"]): Promise<Task> {
    return await db
      .insertInto("task")
      .values({
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description ?? null,
        status: "todo",
        user_id: data.user_id ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  static async update(
    id: string,
    data: TaskModel["updateBody"],
  ): Promise<Task | undefined> {
    return await db
      .updateTable("task")
      .set({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  static async remove(id: string): Promise<boolean> {
    const result = await db
      .deleteFrom("task")
      .where("id", "=", id)
      .executeTakeFirst();

    return (result.numDeletedRows ?? 0n) > 0n;
  }
}
