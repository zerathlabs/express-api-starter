# Developer Guide & Architecture

Welcome to the Express SaaS Starter. This starter is designed for building fast, type-safe, and scalable backend services for SaaS products using **Feature-Based (Modular / Vertical Slice) Architecture**, **Kysely** for database access, and **evlog** for structured logging.

---

## 📁 Project Structure

```text
src/
├── app.ts                  # Express application setup & middleware
├── index.ts                # Server entry point (app.listen & dev auto-migrations)
├── env.ts                  # Type-safe environment variables (Zod + T3-Env)
├── db/                     # Type-safe Database layer (Kysely)
│   ├── index.ts            # Kysely client & connection pool (PostgreSQL / Oracle)
│   ├── types.ts            # Central aggregator for Database interfaces
│   ├── migrator.ts         # Kysely Migrator with FileMigrationProvider
│   ├── seed.ts             # SQL seed runner
│   ├── tables/             # Per-table database interfaces
│   │   └── users.ts        # UserTable, User, NewUser, UserUpdate
│   ├── migrations/         # TypeScript migrations with raw SQL
│   │   └── 001_initial_schema.ts
│   └── seeds/              # Raw .sql seed data files
│       └── seed.sql
├── modules/
│   ├── index.ts            # Central API aggregator (mounted at /api)
│   └── health/             # Example Feature Module
│       ├── model.ts        # Zod validation schemas & TypeScript types
│       ├── service.ts      # Business logic (abstract class with static methods)
│       └── index.ts        # Express route handlers & controller
└── utils/
    ├── logger/             # Standardized structured logger (evlog wrapper)
    ├── response/           # API response formatters (sendSuccess, sendError)
    └── validator/          # Zod validation middleware (body, query, params)
```

---

## 🪵 Structured Logger (`Logger`)

The application uses an `abstract class Logger` wrapping **`evlog`** for structured, wide-event logging across server boot, migrations, seeds, and API requests:

```ts
import { Logger } from "@/utils/logger/index.js";

Logger.info("User created successfully", { userId: "usr_123" });
Logger.warn("Rate limit threshold reached", { ip: req.ip });
Logger.error("Failed to process payment", error, { orderId: "ord_99" });
Logger.debug("Query payload", { query });
```

---

## 🗄️ Database Layer (Kysely)

### Why Kysely?
- **Zero Binary Overhead**: Pure TypeScript query builder without heavy engines.
- **100% Type-Safe Queries**: Table names, columns, join conditions, and return types are checked by TypeScript.
- **Built-in Migration Infrastructure**: Kysely's `Migrator` handles migration tracking (`kysely_migration` table), file ordering, and locking (`kysely_migration_lock`) out of the box.
- **PostgreSQL & Oracle Ready**: Built for PostgreSQL by default, with seamless dialect swapping for Oracle DB (`kysely-oracledb`).

### Writing Migrations

Migrations live in `src/db/migrations/` as TypeScript files with **raw SQL** inside `sql` tagged templates. This gives you the full power of SQL while Kysely handles the migration infrastructure:

```ts
// src/db/migrations/002_create_projects.ts
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS projects`.execute(db);
}
```

> The SQL inside `sql\`...\`` is real, raw SQL — copy-pastable into pgAdmin, DBeaver, or any SQL tool.

### Adding Table Types

When you create a new migration, add the matching type definition in `src/db/tables/`:

```ts
// src/db/tables/projects.ts
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export interface ProjectTable {
  id: Generated<string>;
  name: string;
  owner_id: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Project = Selectable<ProjectTable>;
export type NewProject = Insertable<ProjectTable>;
export type ProjectUpdate = Updateable<ProjectTable>;
```

Then register it in `src/db/types.ts`:

```ts
import type { UserTable } from "./tables/users.js";
import type { ProjectTable } from "./tables/projects.js";

export interface Database {
  users: UserTable;
  projects: ProjectTable;
}

export * from "./tables/users.js";
export * from "./tables/projects.js";
```

### Database Queries in Services

```ts
import { db } from "@/db/index.js";
import type { UserModel } from "./model.js";

export abstract class UserService {
  static async findById(id: string): Promise<UserModel["userResponse"] | null> {
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return user ?? null;
  }

  static async create(data: UserModel["createBody"]) {
    return await db
      .insertInto("users")
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
```

### Running Migrations & Seeds

```bash
pnpm run db:migrate        # Apply all pending migrations
pnpm run db:migrate:down   # Roll back the last migration
pnpm run db:seed           # Seed the database
```

> In **development mode**, migrations run automatically on server startup — no manual step needed.

---

## 🧩 The 3-File Module Pattern

Every feature or domain lives in `src/modules/<feature-name>/`:

```
src/modules/<feature>/
├── model.ts    # 1. Data Contracts (Validation + Types)
├── service.ts  # 2. Business Logic & Database Operations
└── index.ts    # 3. HTTP Endpoints & Request Routing
```

### 1. `model.ts` — Data Contracts & Types

```ts
import { z } from "zod";

export const ProjectModel = {
  createBody: z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
  }),
  projectResponse: z.object({
    id: z.string(),
    name: z.string(),
  }),
} as const;

export type ProjectModel = {
  [K in keyof typeof ProjectModel]: z.infer<(typeof ProjectModel)[K]>;
};
```

### 2. `service.ts` — Business Logic

```ts
import { db } from "@/db/index.js";
import type { ProjectModel } from "./model.js";

export abstract class ProjectService {
  static async create(input: ProjectModel["createBody"]): Promise<ProjectModel["projectResponse"]> {
    const project = await db
      .insertInto("projects")
      .values({ id: crypto.randomUUID(), name: input.name })
      .returningAll()
      .executeTakeFirstOrThrow();

    return { id: project.id, name: project.name };
  }
}
```

### 3. `index.ts` — Express Router & Controllers

```ts
import { Router } from "express";
import { validate } from "@/utils/validator/index.js";
import { sendSuccess } from "@/utils/response/index.js";
import { ProjectModel } from "./model.js";
import { ProjectService } from "./service.js";

const router = Router();

router.post("/", validate({ body: ProjectModel.createBody }), async (req, res) => {
  const project = await ProjectService.create(req.body);
  return sendSuccess(res, project, 201);
});

export const projectRouter = router;
```

---

## 🛠️ Utilities

- **`Logger`**: Structured logging via `Logger.info`, `Logger.warn`, `Logger.error`, `Logger.debug`.
- **`validate({ body, query, params })`**: Automatic Zod validation middleware.
- **`sendSuccess(res, data, statusCode?)`** & **`sendError(res, message, statusCode?)`**: Standardized JSON response formatting.

---

## 💻 Development Commands

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start development server with live reload (`tsx watch`) |
| `pnpm run build` | Build bundle for production into `dist/` (`tsdown`) |
| `pnpm run start` | Run production build (`node dist/index.mjs`) |
| `pnpm run check-types` | Typecheck codebase (`tsc --noEmit`) |
| `pnpm run check` | Format and lint code (`biome check --write .`) |
| `pnpm run db:migrate` | Apply all pending database migrations |
| `pnpm run db:migrate:down` | Roll back the last database migration |
| `pnpm run db:seed` | Seed the database using `src/db/seeds/seed.sql` |
