---
title: TSS Elysia
description: A full-stack TypeScript application using TanStack Start, Elysia, React 19, and Bun
---

## tsse-elysia

[![React Doctor](https://www.react.doctor/share/badge?p=tsse-elysia&s=98&w=3&f=3)](https://www.react.doctor/share?p=tsse-elysia&s=98&w=3&f=3)
[![License](https://img.shields.io/github/license/rjoydip/tsse-elysia)](https://github.com/rjoydip/tsse-elysia/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3+-green)](https://bun.sh)
[![Fallow Health](https://raw.githubusercontent.com/rjoydip/tsse-elysia/badges/health-badge.svg)](https://docs.fallow.tools/)

A full-stack TypeScript application using TanStack Start, Elysia, React 19, and Bun.

> **Project Roadmap**: See [PLANS.md](./knowledge/PLANS.md) for detailed feature planning and progress tracking.

## Quick Start

```bash
bun install
bun run dev
```

## Commands

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `bun run setup`        | Run full project setup (recommended)      |
| `bun run cleanup`      | Clean up build/test artifacts             |
| `bun run dev`          | Start Vite dev server                     |
| `bun run build`        | Build for production                      |
| `bun run start`        | Run production server                     |
| `bun run lint`         | Run oxlint with GitHub format             |
| `bun run lint:ci`      | Lint + format check (CI mode)             |
| `bun run lint:check`   | Lint + format + fallow check (Local mode) |
| `bun run lint:fix`     | Auto-fix lint issues and format           |
| `bun run fmt`          | Format code with oxfmt                    |
| `bun run fmt:check`    | Check formatting without fixing           |
| `bun run typecheck`    | TypeScript type checking (tsc --noEmit)   |
| `bun run react:doctor` | React doctor diagnostics                  |
| `bun run changeset`    | Create a changeset                        |
| `bun run prepare`      | Install git hooks                         |
| `bun run test:unit`    | Unit tests with Bun                       |
| `bun run test:e2e`     | E2E tests with Playwright                 |
| `bun run test:load`    | Load tests with k6                        |

### Setup Script

Run once after cloning the project to set up everything:

```bash
bun run setup
```

What it does:

1. Checks Bun runtime is installed
2. Installs project dependencies
3. Creates `.env` from `.env.example`
4. Generates database schema and runs migrations
5. Seeds the database with initial data
6. Sets up git hooks
7. Runs typecheck to verify setup

Options:

- `--skip-db` - Skip database setup (if you want to set it up manually)

### Cleanup Script

Clean up build artifacts, test results, and temporary files:

```bash
bun run cleanup
```

Options:

- `--dry-run` - Show what would be deleted without actually deleting
- `--keep-db` - Preserve database files (`.artifacts/*.db`)
- `--full` - Full reset including `node_modules` (rarely needed)

> **Note:** Executable files like `k6.exe` in `.artifacts/` are automatically preserved during cleanup.
> Before load test make sure to run vite preview `bun run preview`

## Documentation

Detailed documentation available in `docs/`:

| Document                                                      | Description                  |
| ------------------------------------------------------------- | ---------------------------- |
| [API Reference](docs/api/overview.md)                         | API endpoints and usage      |
| [Architecture](docs/getting-started/architecture.md)          | System architecture overview |
| [Authentication](docs/auth/overview.md)                       | Auth setup and configuration |
| [CI/CD](docs/infra/ci-cd.md)                                  | CI/CD pipelines and releases |
| [Development](docs/getting-started/development.md)            | Development guide            |
| [Docker](docs/infra/docker.md)                                | Docker deployment guide      |
| [Environment Variables](docs/guides/environment-variables.md) | Environment configuration    |
| [Middleware](docs/guides/middleware.md)                       | Middleware documentation     |
| [Overview](docs/guides/overview.md)                           | Project introduction         |
| [Testing](docs/guides/testing.md)                             | Testing guide                |
| [Tools Reference](docs/reference/tools.md)                    | Core tools and technologies  |
| [Troubleshooting](docs/guides/troubleshooting.md)             | Common issues and solutions  |

## Tech Stack

- **Framework**: TanStack Start
- **Server**: Elysia
- **Runtime**: Bun
- **UI**: React 19 + TypeScript
- **Form**: TanStack Form
- **Table**: TanStack Table v8
- **State Management**: TanStack Store
- **Function Execution Timing**: TanStack Pacer
- **Styling**: Tailwind CSS v4
- **Logging**: Evlog with structured logging and multiple adapters (FS, OTLP)
- **Cache**: Unstorage with multi-backend support
  - Redis (when `REDIS_URL` is set)
  - PostgreSQL (when `DATABASE_TYPE=postgres`)
  - LRU Cache (default for SQLite)
- **Pub/Sub**: Unstorage-based with multi-backend support (Redis recommended for cross-instance)

## API Architecture

The API follows a layered architecture pattern (HTTP → Controller → Service → Repository):

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Layer (routes/)                    │
│  - Elysia route definitions                                 │
│  - Request/Response handling                                │
│  - OpenAPI documentation                                    │
│  - Delegates to controllers                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Controller Layer (controllers/)              │
│  - Session validation                                       │
│  - Request parsing and validation                           │
│  - Response formatting                                      │
│  - HTTP-specific logic                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Service Layer (services/)                   │
│  - Business logic                                           │
│  - Data transformation                                      │
│  - Validation rules                                         │
│  - Orchestrates repositories                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository Layer (repositories/)               │
│  - ORM operations (Drizzle)                                 │
│  - Database queries                                         │
│  - Data access abstraction                                  │
│  - Interface-based design                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database (SQLite/PostgreSQL)            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer          | Directory           | Responsibility                                           |
| -------------- | ------------------- | -------------------------------------------------------- |
| **HTTP**       | `src/routes/api/`   | Route definitions, HTTP handling, OpenAPI docs           |
| **Controller** | `src/controllers/`  | Session validation, request parsing, response formatting |
| **Service**    | `src/services/`     | Business logic, data transformation, validation          |
| **Repository** | `src/repositories/` | ORM operations, database queries, data access            |

### Example Flow (Settings API)

```
Request → routes/api/settings/-profile.ts (HTTP)
         ↓
         controllers/settings/controller.ts (session validation)
         ↓
         services/dashboard/settings/profile.ts (business logic)
         ↓
         repositories/settings/profile.repository.ts (ORM query)
         ↓
         Database
```

## Project Structure

```bash
src/
├── assets/             # Static assets and icons
│   ├── auth-banner-dark.png
│   ├── auth-banner-light.png
│   ├── brand-icons/    # Brand icons (Facebook, GitHub, Gmail)
│   ├── custom/        # Custom icons (layout, sidebar, theme)
│   ├── shared/        # Shared icon base component
│   └── logo.tsx
├── components/         # React components
│   ├── ui/            # shadcn/ui components (30+ components)
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── tooltip.tsx
│   │   └── error-display.tsx # Reusable error display
│   ├── data-table/    # TanStack Table components
│   │   ├── index.ts
│   │   ├── pagination.tsx
│   │   ├── column-header.tsx
│   │   ├── toolbar.tsx
│   │   └── view-options.tsx
│   ├── auth/          # Auth components (simplified)
│   │   └── auth-guard.tsx
│   ├── docs/         # Documentation components
│   │   ├── sidebar.tsx
│   │   ├── markdown.tsx
│   │   └── code-highlight.tsx
│   ├── layout/       # Layout components
│   │   ├── app-sidebar.tsx
│   │   ├── header.tsx
│   │   ├── landing/  # Landing page components
│   │   └── types.ts
│   ├── settings/    # Settings components
│   ├── profile/     # Profile components
│   ├── theme/       # Theme components
│   └── shared/      # Shared components (multi-delete-dialog, etc.)
├── config/             # Central configuration
│   ├── index.ts       # Main config exports
│   ├── auth.ts       # Better Auth configuration
│   ├── db/           # Database config (heartbeat, index)
│   ├── docs.ts       # Documentation config
│   ├── env.ts        # Environment validation
│   ├── evlog.ts      # Evlog configuration
│   └── features.tsx  # Shared features config
├── context/           # React context providers
│   ├── direction-provider.tsx
│   ├── font-provider.tsx
│   ├── layout-provider.tsx
│   ├── search-provider.tsx
│   └── theme-provider.tsx
├── controllers/       # Controller layer (HTTP-specific logic)
│   ├── mcp/          # MCP controllers
│   ├── settings/     # Settings controllers
│   └── index.ts
├── features/          # Feature modules (components, pages, data)
│   ├── apps/         # Apps feature
│   ├── auth/         # Auth feature (sign-in, sign-up, OTP, forgot-password)
│   │   ├── shared/   # Shared auth components (email-field, social-sign-in)
│   │   └── components/
│   ├── chats/        # Chats feature
│   ├── dashboard/    # Dashboard feature
│   ├── errors/       # Error pages (401, 403, 404, 500, 503)
│   ├── landing/       # Landing pages (blog, changelog, docs, status)
│   ├── settings/      # Settings feature (account, appearance, profile, notifications)
│   ├── tasks/        # Task management feature
│   └── users/        # User management feature
├── hooks/             # Custom React hooks
│   ├── use-dialog-state.tsx
│   ├── use-mobile.tsx
│   ├── use-scroll-direction.tsx
│   └── use-table-url-state.ts
├── lib/               # Library code
│   ├── auth/          # Authentication (Better Auth)
│   │   ├── index.ts   # Server auth instance
│   │   ├── client.ts  # Client auth hooks
│   │   └── dashboard/ # Dashboard auth utilities
│   ├── cache/         # Cache layer (Unstorage-backed)
│   ├── db/            # Database (Drizzle + SQLite/PostgreSQL)
│   │   ├── schema/   # DB schemas (auth, mcp, subscriptions, user-settings)
│   │   └── schema.ts
│   ├── mcp/          # MCP (Model Context Protocol)
│   │   ├── tools/    # MCP tools (auth, users, organizations, shared-utils)
│   │   ├── shared/   # Shared MCP utilities (auth-utils, response-helpers)
│   │   └── server.ts
│   ├── stores/        # TanStack Stores
│   └── dashboard/    # Dashboard utilities (CSRF, rate-limit, sanitizer)
├── middlewares/       # Middleware implementations
│   ├── cors.ts
│   ├── helmet.ts
│   ├── rate-limit.ts
│   └── index.ts
├── plugins/           # Vite/Plugin configurations
│   ├── evlog-plugin.ts
│   ├── monitoring.ts
│   └── websocket.ts
├── repositories/       # Repository layer (ORM operations)
│   ├── mcp/          # MCP repositories
│   ├── settings/     # Settings repositories
│   └── index.ts
├── services/          # Service layer (business logic)
│   ├── settings/      # Settings services (profile, account, display, notifications)
│   ├── llmo/         # LLM optimization services (blog, docs, changelog, FAQ)
│   ├── mcp/          # MCP services (api-keys, tools, rate-limiter)
│   └── status/       # Status services (history)
├── routes/            # File-based routing (TanStack Start)
│   ├── (auth)/       # Auth routes (sign-in, sign-up, OTP, forgot-password, verify-email)
│   ├── (errors)/     # Error pages (401, 403, 404, 500, 503)
│   ├── (landing)/    # Landing routes (blog, changelog, docs, status, privacy, terms)
│   ├── _authenticated/ # Protected routes (dashboard, tasks, users, chats, settings)
│   ├── api/          # API routes (HTTP Layer)
│   │   ├── auth/     # Auth API routes
│   │   ├── mcp/     # MCP API routes
│   │   ├── root/     # Core API routes (cache, database, llmo, realtime, status)
│   │   └── settings/ # Settings API routes
│   ├── __root.tsx    # Root route
│   └── index.tsx     # Home route
├── server.ts          # TanStack Start server entry
├── router.tsx         # TanStack Router configuration
├── routeTree.gen.ts   # Auto-generated route tree
├── types/             # TypeScript type definitions
└── styles/           # Global styles
    └── app.css       # Tailwind CSS v4 imports
```

## Test Structure

```bash
test/                  # Unit tests (Bun)
├── config/           # Configuration tests
│   ├── db/           # Database config tests
│   ├── docs.test.ts  # Docs config tests (globKeyToDocPath, getSplatPath, buildDocMap)
│   └── index.test.ts # App config tests
├── components/       # Component tests
│   ├── ui/          # UI component tests
│   ├── auth/        # Auth component tests
│   ├── data-table/   # Data-table component tests
│   ├── docs/        # Docs component tests
│   ├── layout/      # Layout component tests
│   ├── profile/     # Profile component tests
│   └── settings/    # Settings component tests
├── context/        # Context tests
├── features/       # Feature tests
│   ├── apps/       # Apps feature tests
│   ├── auth/      # Auth feature tests
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── otp/
│   ├── chats/      # Chats feature tests
│   ├── dashboard/ # Dashboard feature tests
│   ├── errors/    # Errors feature tests
│   ├── landing/    # Landing feature tests
│   ├── settings/  # Settings feature tests
│   ├── tasks/     # Tasks feature tests
│   └── users/     # Users feature tests
├── fixtures/       # Test fixtures
├── hooks/         # Hook tests
├── lib/           # Library tests
│   ├── auth/      # Auth library tests
│   ├── cache/     # Cache library tests
│   ├── dashboard/ # Dashboard library tests
│   ├── db/        # Database tests
│   ├── mcp/      # MCP library tests
│   │   └── tools/ # MCP tools tests
│   ├── rate-limit/ # Rate limit tests
│   ├── realtime/  # Realtime tests
│   └── store/     # Store tests
├── middlewares/   # Middleware tests
│   ├── cors.test.ts
│   ├── helmet.test.ts
│   ├── rate-limit.ts
│   └── index.test.ts
├── plugins/      # Plugin tests
├── routes/      # Route tests
│   ├── api/     # API route tests
│   │   ├── auth/
│   │   ├── mcp/
│   │   └── settings/
│   └── (auth)/  # Auth route tests
├── services/    # Service layer tests
│   ├── cache/   # Cache service tests
│   ├── dashboard/ # Dashboard service tests
│   ├── llmo/    # LLMO service tests
│   ├── mcp/    # MCP service tests
│   └── status/  # Status service tests
└── scripts/    # Script tests/

.e2e/                 # E2E tests (Playwright)
├── ui/               # UI E2E tests (split by component)
│   ├── button.spec.ts
│   ├── input.spec.ts
│   ├── sidebar.spec.ts
│   └── ...
├── api/              # API E2E tests
│   ├── endpoints.spec.ts
│   ├── middlewares.spec.ts
│   └── redis-health.spec.ts  # Redis heartbeat E2E
├── middlewares/      # Middleware-specific E2E tests
│   ├── cors.spec.ts
│   ├── helmet.spec.ts
│   ├── trace.spec.ts
│   ├── error-handling.spec.ts
│   └── rate-limit.spec.ts
├── routes/           # Route E2E tests
│   ├── auth.spec.ts
│   ├── blog.spec.ts
│   ├── changelog.spec.ts
│   ├── docs.spec.ts
│   ├── profile.spec.ts
│   ├── settings.spec.ts
│   └── status.spec.ts
├── auth.spec.ts       # Auth flow tests
├── landing.spec.ts   # Landing page tests
├── navigation.spec.ts # Navigation tests
└── config.ts         # E2E configuration

.k6/                  # Load tests (k6)
├── api-test.js
├── smoke-test.js
└── stress-test.js
```

## Code Style

### Formatting

- Use **oxfmt** for code formatting (configured in `.oxfmtrc.json`)
- Run `bun run fmt` before committing

### Linting

- Uses **oxlint** with plugins: `unicorn`, `typescript`, `oxc`
- Configuration in `.oxlintrc.json`

### TypeScript

- Path alias: `~/*` maps to `./src/*`
- JSX mode: `react-jsx`

### Naming Conventions

- **Components**: PascalCase (e.g., `RootDocument`)
- **Files**: kebab-case for routes (e.g., `__root.tsx`)
- **Utilities**: camelCase (e.g., `getRouter()`)
- **Constants**: SCREAMING_SNAKE_CASE`

### Imports

- Use path alias `~/*` for src imports (e.g., `import appCss from "~/styles/app.css?url"`)
- CSS imports require `?url` suffix for Vite`

### React Patterns

- Functional components with TypeScript
- Use `createRootRoute`, `createRoute` from `@tanstack/react-router`
- Use `<Link>` for navigation, `<HeadContent />`, `<Scripts />` in root layout
- Include `<TanStackRouterDevtools>` in development (bottom-right)

### Error Handling

- Use `defaultErrorComponent` and `defaultNotFoundComponent` in router config
- Return proper HTTP status codes in server handlers`

### CSS

- Tailwind CSS v4 with Vite plugin
- Import with `@import "tailwindcss";` in `app.css`

### Validation

- Uses **Zod v4** for runtime validation
- Prefer Zod schemas over custom validation logic`

## Git Workflow

- Pre-commit hooks run: `lint`, `typecheck`, `react:doctor`
- Use changesets for version management:

  ```bash
  bun run changeset   # Create changeset
  bun run version     # Update versions
  bun run release     # Publish to npm
  ```

## Troubleshooting

For more detailed troubleshooting guide, see [Troubleshooting](docs/guides/troubleshooting.md).

Common issues:

- If imports fail, ensure `bun install` has run`
- Path alias `~/*` requires TypeScript paths configuration`
- CSS files must use `?url` suffix for Vite's asset handling`

## For AI Agents

For detailed agent coding guidelines, see [AGENTS.md](./AGENTS.md).

For feature planning and progress tracking, see [PLANS.md](./knowledge/PLANS.md).