# Express Starter

A fast, lightweight, and modern standalone Express starter built with TypeScript, tsdown, Biome, and evlog.

## Features

- **Express 5** with TypeScript
- **@t3-oss/env-core & Zod** for type-safe environment variables
- **tsdown** for fast ESM builds
- **tsx** for rapid TypeScript development with watch mode
- **Biome** for lightning-fast formatting and linting
- **evlog** for structured logging and request observability

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Development Server

Start the development server with live reload:

```bash
pnpm run dev
```

The server will be running at `http://localhost:3000`.

### 4. Available Scripts

- `pnpm run dev`: Start dev server with watch mode (`tsx`)
- `pnpm run build`: Bundle the server to `dist/` (`tsdown`)
- `pnpm run start`: Run production build with `node`
- `pnpm run check-types`: Run TypeScript compiler type-check (`tsc`)
- `pnpm run check`: Check and format code with Biome
