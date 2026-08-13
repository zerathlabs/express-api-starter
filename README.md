# Express SaaS Starter

A high-performance, type-safe, and modular Express starter template designed for modern SaaS products. Built with TypeScript, Kysely, Zod, tsdown, Biome, and evlog.

## 📖 Architecture & Developer Guide

For a complete step-by-step walkthrough on how to build features and write database queries in this starter, see the [Developer Guide (GUIDE.md)](./GUIDE.md).

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
```bash
pnpm run db:migrate
```

### 4. Start Development Server
```bash
pnpm run dev
```
The server will start at `http://localhost:3000`.

---

## 📁 Project Architecture

```
src/
├── app.ts                  # Express application setup, global middleware, & route mounting
├── index.ts                # Server startup & listener entry point
├── env.ts                  # Type-safe environment validation
├── db/                     # Type-safe Database layer (Kysely)
│   ├── index.ts            # Kysely client connection pool (PostgreSQL / Oracle)
│   ├── types.ts            # Database schema interfaces & types
│   ├── migrator.ts         # CLI migration runner
│   └── migrations/         # Migration scripts
├── modules/
│   ├── index.ts            # Central API router aggregator (/api)
│   └── health/             # Standard Feature Module (Example)
│       ├── model.ts        # Zod schemas & TypeScript types
│       ├── service.ts      # Abstract class with static business logic
│       └── index.ts        # Express Router & controllers
└── utils/
    ├── response/           # Standardized API response helpers (sendSuccess / sendError)
    └── validator/          # Type-safe Zod validation middleware (body, query, params)
```

---

## 🛠️ Available Scripts

- `pnpm run dev`: Start dev server with watch mode (`tsx`)
- `pnpm run build`: Bundle the server to `dist/` (`tsdown`)
- `pnpm run start`: Run production build with `node`
- `pnpm run check-types`: Run TypeScript compiler type-check (`tsc`)
- `pnpm run check`: Check and format code with Biome
- `pnpm run db:migrate`: Run pending database migrations
- `pnpm run db:migrate:down`: Roll back the latest migration
