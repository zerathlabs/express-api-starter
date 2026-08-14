# Developer Guide & Architecture

Welcome to the Express SaaS Starter. This starter is designed for building fast, type-safe, and scalable backend services for SaaS products using **Feature-Based (Modular / Vertical Slice) Architecture**, **Kysely** for database access, and **evlog** for structured logging.

---

## 📁 Project Structure

```text
starter/
├── docker-compose.yml       # Local PostgreSQL database container setup
├── GUIDE.md                 # Developer & Architecture guide
├── README.md                # Quickstart & documentation
├── src/
│   ├── app.ts               # Express application setup & middleware
│   ├── index.ts             # Server entry point (app.listen & dev auto-migrations)
│   ├── env.ts               # Type-safe environment variables (Zod + T3-Env)
│   ├── db/                  # Type-safe Database layer (Kysely)
│   │   ├── index.ts         # Kysely client & connection pool (PostgreSQL / Oracle)
│   │   ├── types.ts         # Central aggregator for Database interface
│   │   ├── migrator.ts      # Kysely Migrator runner
│   │   ├── seed.ts          # SQL seed runner
│   │   ├── tables/          # Per-table database interfaces (singular names)
│   │   │   ├── index.ts     # Barrel export (@/db/tables/index.js)
│   │   │   ├── user.ts      # UserTable, User, NewUser, UserUpdate
│   │   │   └── task.ts      # TaskTable, Task, NewTask, TaskUpdate
│   │   ├── migrations/      # TypeScript migrations with raw SQL
│   │   │   └── 001_initial_schema.ts
│   │   └── seeds/           # Raw .sql seed data files
│   │       └── seed.sql
│   ├── modules/             # Feature Modules
│   │   ├── index.ts         # Central API router aggregator (mounted at /api)
│   │   ├── health/          # System health check module
│   │   └── task/            # Task / Todo example module (Full CRUD)
│   └── utils/
│       ├── logger/          # Standardized structured logger (evlog wrapper)
│       ├── response/        # API response formatters (sendSuccess, sendError)
│       └── validator/       # Zod validation middleware (body, query, params)
```

---

## 🐳 Running PostgreSQL via Docker

Start a local PostgreSQL 17 container:

```bash
docker compose up -d
```

Connection details:
- **Host**: `localhost:5432`
- **Database**: `starter_db`
- **User / Password**: `postgres` / `postgres`
- **Connection String**: `postgresql://postgres:postgres@localhost:5432/starter_db`

---

## 🗄️ Database Layer & Naming Conventions

### Singular Table Naming & Barrel Export
Tables use **singular names** (`user`, `task`). All entity types are exported from `src/db/tables/index.ts`:

```ts
// In your services:
import { db } from "@/db/index.js";
import type { NewTask, Task, User } from "@/db/tables/index.js";
```

### Table Definitions (`src/db/tables/task.ts`)
```ts
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export interface TaskTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  user_id: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export type Task = Selectable<TaskTable>;
export type NewTask = Insertable<TaskTable>;
```

### Kysely Database Interface (`src/db/types.ts`)
```ts
import type { TaskTable, UserTable } from "./tables/index.js";

export interface Database {
  user: UserTable;
  task: TaskTable;
}

export type * from "./tables/index.js";
```

---

## 🧩 Feature Module Example (`task`)

The `task` module demonstrates complete CRUD operations using the 3-file pattern:

### 1. `model.ts`
```ts
import { z } from "zod";

export const TaskModel = {
  createBody: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    user_id: z.string().optional(),
  }),
  updateBody: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
  }),
  idParam: z.object({ id: z.string().min(1) }),
} as const;

export type TaskModel = {
  [K in keyof typeof TaskModel]: z.infer<(typeof TaskModel)[K]>;
};
```

### 2. `service.ts`
```ts
import { db } from "@/db/index.js";
import type { Task } from "@/db/tables/index.js";
import type { TaskModel } from "./model.js";

export abstract class TaskService {
  static async list(): Promise<Task[]> {
    return await db.selectFrom("task").selectAll().execute();
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
}
```

### 3. `index.ts`
```ts
import { Router } from "express";
import { sendSuccess } from "@/utils/response/index.js";
import { validate } from "@/utils/validator/index.js";
import { TaskModel } from "./model.js";
import { TaskService } from "./service.js";

const router = Router();

router.get("/", async (_req, res) => {
  const tasks = await TaskService.list();
  return sendSuccess(res, tasks);
});

router.post("/", validate({ body: TaskModel.createBody }), async (req, res) => {
  const task = await TaskService.create(req.body);
  return sendSuccess(res, task, 201);
});

export const taskRouter = router;
```

---

## 💻 CLI Commands

| Command | Description |
| --- | --- |
| `docker compose up -d` | Launch local PostgreSQL container |
| `pnpm run dev` | Start dev server with watch mode (`tsx`) |
| `pnpm run build` | Build bundle for production (`tsdown`) |
| `pnpm run test` | Run unit and integration tests (`vitest`) |
| `pnpm run check-types` | Typecheck codebase (`tsc --noEmit`) |
| `pnpm run check` | Format and lint code (`biome check --write .`) |
| `pnpm run db:migrate` | Run database migrations |
| `pnpm run db:migrate:down` | Rollback last database migration |
| `pnpm run db:seed` | Seed database with sample tasks and users |
