# Developer Guide & Architecture

Welcome to the Express SaaS Starter. This starter is designed for building fast, type-safe, and scalable backend services for SaaS products using **Feature-Based (Modular / Vertical Slice) Architecture**.

---

## 📁 Project Structure

```text
src/
├── app.ts                  # Express application setup & middleware
├── index.ts                # Server entry point (app.listen)
├── env.ts                  # Type-safe environment variables (Zod + T3-Env)
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

## 🧩 The 3-File Module Pattern

Every feature or domain in your application (e.g., `auth`, `users`, `billing`, `projects`, `organizations`) lives in its own folder inside `src/modules/<feature-name>/` with exactly 3 files:

```
src/modules/<feature>/
├── model.ts    # 1. Data Contracts (Validation + Types)
├── service.ts  # 2. Business Logic & Database Operations
└── index.ts    # 3. HTTP Endpoints & Request Routing
```

### 1. `model.ts` — Data Contracts & Types
Define all input validation schemas and response structures using Zod. We export a single `FeatureModel` object alongside an auto-mapped TypeScript type:

```ts
import { z } from "zod";

export const ProjectModel = {
  // Request body schema for creation
  createBody: z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
  }),

  // Query parameter schema
  listQuery: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  }),

  // Response shape
  projectResponse: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
  }),
} as const;

// Automatically map all Zod schemas into TypeScript types
export type ProjectModel = {
  [K in keyof typeof ProjectModel]: z.infer<(typeof ProjectModel)[K]>;
};
```

### 2. `service.ts` — Business Logic
Encapsulate all business logic, database queries, and external API calls inside an `abstract class` with `static` methods. 

> **Why `abstract class`?**
> - Cannot be mistakenly instantiated (`new ProjectService()` is forbidden).
> - Zero memory allocation overhead.
> - Keeps functions organized in a clean domain namespace (`ProjectService.create()`).

```ts
import type { ProjectModel } from "./model.js";

export abstract class ProjectService {
  static async create(input: ProjectModel["createBody"]): Promise<ProjectModel["projectResponse"]> {
    // Perform database operations (e.g., db.insert(...) / prisma.project.create(...))
    return {
      id: "proj_123",
      name: input.name,
      description: input.description ?? null,
      createdAt: new Date().toISOString(),
    };
  }

  static async list(query: ProjectModel["listQuery"]) {
    // Query database with pagination
    return [];
  }
}
```

### 3. `index.ts` — Express Router & Controllers
Attach your routes, apply validation middleware, and call the service. Keep route handlers thin — they should only receive requests, validate, delegate to the service, and return responses.

```ts
import { Router } from "express";
import { validate } from "@/utils/validator/index.js";
import { sendSuccess } from "@/utils/response/index.js";
import { ProjectModel } from "./model.js";
import { ProjectService } from "./service.js";

const router = Router();

// POST /api/projects
router.post(
  "/",
  validate({ body: ProjectModel.createBody }),
  async (req, res) => {
    const project = await ProjectService.create(req.body);
    return sendSuccess(res, project, 201);
  }
);

// GET /api/projects
router.get(
  "/",
  validate({ query: ProjectModel.listQuery }),
  async (req, res) => {
    const projects = await ProjectService.list(req.query);
    return sendSuccess(res, projects);
  }
);

export const projectRouter = router;
```

---

## 🚀 How to Add a New Feature (Step-by-Step)

Let's say you want to add a new `users` module:

1. **Create the module folder**:
   ```
   src/modules/users/
   ├── model.ts
   ├── service.ts
   └── index.ts
   ```

2. **Define schemas in `model.ts`**:
   ```ts
   import { z } from "zod";

   export const UserModel = {
     createBody: z.object({
       email: z.string().email(),
       name: z.string(),
     }),
     userResponse: z.object({
       id: z.string(),
       email: z.string(),
       name: z.string(),
     }),
   } as const;

   export type UserModel = {
     [K in keyof typeof UserModel]: z.infer<(typeof UserModel)[K]>;
   };
   ```

3. **Implement business logic in `service.ts`**:
   ```ts
   import type { UserModel } from "./model.js";

   export abstract class UserService {
     static async create(data: UserModel["createBody"]): Promise<UserModel["userResponse"]> {
       return { id: "usr_1", ...data };
     }
   }
   ```

4. **Expose routes in `index.ts`**:
   ```ts
   import { Router } from "express";
   import { validate } from "@/utils/validator/index.js";
   import { sendSuccess } from "@/utils/response/index.js";
   import { UserModel } from "./model.js";
   import { UserService } from "./service.js";

   const router = Router();

   router.post("/", validate({ body: UserModel.createBody }), async (req, res) => {
     const user = await UserService.create(req.body);
     return sendSuccess(res, user, 201);
   });

   export const userRouter = router;
   ```

5. **Register in `src/modules/index.ts`**:
   ```ts
   import { Router } from "express";
   import { healthRouter } from "./health/index.js";
   import { userRouter } from "./users/index.js";

   export const apiRouter = Router();

   apiRouter.use("/health", healthRouter);
   apiRouter.use("/users", userRouter); // -> Available at /api/users
   ```

---

## 🛠️ Utilities

### `validate({ body, query, params })`
Located in `src/utils/validator/index.ts`. Automatically validates incoming request payloads against Zod schemas and returns a standardized `400 Bad Request` with errors if validation fails.

### `sendSuccess(res, data, statusCode?)` & `sendError(res, message, statusCode?)`
Located in `src/utils/response/index.ts`. Ensures consistent JSON response structures across all endpoints:

```json
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "message": "Invalid credentials"
  }
}
```

---

## ⚙️ Environment Variables

All environment variables are validated at startup in [src/env.ts](file:///c:/Users/i7/Documents/purple/starter/src/env.ts).

To add a new variable (e.g., `DATABASE_URL`):
1. Add it to `.env` and `.env.example`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/saas_db"
   ```
2. Add schema to `src/env.ts`:
   ```ts
   export const env = createEnv({
     server: {
       CORS_ORIGIN: z.string().url().default("http://localhost:3001"),
       DATABASE_URL: z.string().min(1),
       NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
     },
     runtimeEnv: process.env,
   });
   ```

---

## 💻 Development Commands

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start development server with live reload (`tsx watch`) |
| `pnpm run build` | Build bundle for production into `dist/` (`tsdown`) |
| `pnpm run start` | Run production build (`node dist/index.mjs`) |
| `pnpm run check-types` | Typecheck codebase with TypeScript compiler (`tsc --noEmit`) |
| `pnpm run check` | Format and lint code with Biome (`biome check --write .`) |
