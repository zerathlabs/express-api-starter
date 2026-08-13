# Developer Guide & Architecture

Welcome to the Express SaaS Starter. This starter is designed for building fast, type-safe, and scalable backend services for SaaS products using **Feature-Based (Modular / Vertical Slice) Architecture** and **Kysely** for type-safe database access.

---

## 📁 Project Structure

```text
src/
├── app.ts                  # Express application setup & middleware
├── index.ts                # Server entry point (app.listen)
├── env.ts                  # Type-safe environment variables (Zod + T3-Env)
├── db/                     # Type-safe Database layer (Kysely)
│   ├── index.ts            # Kysely client & connection pool
│   ├── types.ts            # Generated/typed Database schema interfaces
│   ├── migrator.ts         # Migration CLI runner
│   └── migrations/         # Migration scripts (001_initial_schema.ts, etc.)
├── modules/
│   ├── index.ts            # Central API aggregator (mounted at /api)
│   └── health/             # Example Feature Module
│       ├── model.ts        # Zod validation schemas & TypeScript types
│       ├── service.ts      # Business logic (abstract class with static methods)
│       └── index.ts        # Express route handlers & controller
└── utils/
    ├── response/           # Standardized API response formatters (sendSuccess, sendError)
    └── validator/          # Reusable Zod validation middleware (body, query, params)
```

---

## 🗄️ Database Layer (Kysely)

### Why Kysely?
- **Zero Binary Overhead**: Pure TypeScript query builder without heavy engines.
- **100% Type-Safe**: Table names, columns, join conditions, and return types are fully checked by TypeScript.
- **PostgreSQL & Oracle Ready**: Built for PostgreSQL by default, with seamless dialect swapping for Oracle DB (`kysely-oracledb`).

### Database Queries in Services
Import `db` from `@/db/index.js` inside your `service.ts`:

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

### Running Migrations
- Apply all pending migrations:
  ```bash
  pnpm run db:migrate
  ```
- Roll back the latest migration:
  ```bash
  pnpm run db:migrate:down
  ```

### Creating New Migrations
Create a timestamped or numbered file in `src/db/migrations/`:
```ts
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("projects")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("owner_id", "text", (col) => col.references("users.id").onDelete("cascade"))
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("projects").execute();
}
```

---

## 🧩 The 3-File Module Pattern

Every feature or domain in your application lives in `src/modules/<feature-name>/`:

```
src/modules/<feature>/
├── model.ts    # 1. Data Contracts (Validation + Types)
├── service.ts  # 2. Business Logic & Database Operations
└── index.ts    # 3. HTTP Endpoints & Request Routing
```

### 1. `model.ts` — Data Contracts & Types
Define all input validation schemas and response structures using Zod:

```ts
import { z } from "zod";

export const ProjectModel = {
  createBody: z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
  }),
  listQuery: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  }),
  projectResponse: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
  }),
} as const;

export type ProjectModel = {
  [K in keyof typeof ProjectModel]: z.infer<(typeof ProjectModel)[K]>;
};
```

### 2. `service.ts` — Business Logic
Encapsulate all business logic inside an `abstract class` with `static` methods:

```ts
import { db } from "@/db/index.js";
import type { ProjectModel } from "./model.js";

export abstract class ProjectService {
  static async create(input: ProjectModel["createBody"]): Promise<ProjectModel["projectResponse"]> {
    const project = await db
      .insertInto("projects")
      .values({
        id: crypto.randomUUID(),
        name: input.name,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      ...project,
      description: null,
      createdAt: project.created_at.toISOString(),
    };
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

router.post(
  "/",
  validate({ body: ProjectModel.createBody }),
  async (req, res) => {
    const project = await ProjectService.create(req.body);
    return sendSuccess(res, project, 201);
  }
);

export const projectRouter = router;
```

---

## 🛠️ Utilities

- `validate({ body, query, params })`: Automatic Zod validation middleware.
- `sendSuccess(res, data, statusCode?)` & `sendError(res, message, statusCode?)`: Standardized JSON response formatting.

---

## 💻 Development Commands

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start development server with live reload (`tsx watch`) |
| `pnpm run build` | Build bundle for production into `dist/` (`tsdown`) |
| `pnpm run start` | Run production build (`node dist/index.mjs`) |
| `pnpm run check-types` | Typecheck codebase with TypeScript compiler (`tsc --noEmit`) |
| `pnpm run check` | Format and lint code with Biome (`biome check --write .`) |
| `pnpm run db:migrate` | Apply all pending database migrations |
| `pnpm run db:migrate:down` | Roll back the last database migration |
