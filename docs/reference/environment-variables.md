---
title: Environment Variables
description: Type-safe environment configuration
---

## Environment Variables

This project uses type-safe environment variables with isomorphic fetching, supporting both client and server environments.

## Server Configuration

| Variable                      | Default        | Description                                    |
| ----------------------------- | -------------- | ---------------------------------------------- |
| `HOST`                        | `localhost`    | Server host                                    |
| `PORT`                        | `3000`         | Server port                                    |
| `VITE_API_URL`                | Dynamic        | Client API URL for Eden Treaty                 |
| `DATABASE_TYPE`               | `sqlite`       | Database type: `sqlite` or `postgres`          |
| `SQLITE_URL`                  | -              | Database SQLite connection URL                 |
| `POSTGRES_URL`                | -              | PostgreSQL connection URL (when type=postgres) |
| `BETTER_AUTH_SECRET`          | Auto-generated | Authentication secret for session tokens       |
| `WS_ENABLED`                  | -              | Enables/disables websocket transport           |
| `WS_HEARTBEAT_INTERVAL`       | -              | Websocket heartbeat interval                   |
| `WS_MAX_MESSAGE_SIZE`         | -              | Max websocket message size                     |
| `WS_RATE_LIMIT_MESSAGES`      | -              | Websocket messages allowed per window          |
| `WS_RATE_LIMIT_WINDOW`        | -              | Websocket rate-limit window (ms)               |
| `REDIS_URL`                   | -              | Redis connection URL for cache & pub/sub       |
| `EVLOG_ADAPTER`               | `fs`           | Log adapter: `fs` or `otlp`                    |
| `EVLOG_DIR`                   | `.evlog/logs`  | Directory for local log files                  |
| `EVLOG_LOG_LEVEL`             | -              | Minimum log level to output                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | -              | OTLP endpoint for production logging           |

## Database Configuration

| Variable            | Default  | Description                                    |
| ------------------- | -------- | ---------------------------------------------- |
| `DATABASE_TYPE`     | `sqlite` | Database type (`sqlite` or `postgres`)         |
| `SQLITE_URL`        | -        | LibSQL connection URL (Turso, file path, etc.) |
| `SQLITE_AUTH_TOKEN` | -        | Auth token for Turso/remote databases          |

The database configuration supports multiple backends:

### SQLite (Default - LibSQL)

```bash
# Default configuration
DATABASE_TYPE=sqlite bun run dev

# Use Turso remote database
SQLITE_URL=libsql://your-database.turso.io
SQLITE_AUTH_TOKEN=your-auth-token

# Use local file-based database
SQLITE_URL=file:./path/to/database.db
```

### PostgreSQL

```bash
# Using POSTGRES_URL
DATABASE_TYPE=postgres POSTGRES_URL=postgresql://user:pass@localhost:5432/db bun run dev

# Using individual connection parameters
DATABASE_TYPE=postgres POSTGRES_USER=user POSTGRES_PASSWORD=pass POSTGRES_DB=db POSTGRES_HOST=localhost POSTGRES_PORT=5432 bun run dev
```

### PostgreSQL with Replicas

```bash
# Set replica URLs as JSON array
DATABASE_TYPE=postgres POSTGRES_URL=postgresql://user:pass@localhost:5432/db POSTGRES_REPLICAS='["postgresql://user:pass@replica1:5432/db","postgresql://user:pass@replica2:5432/db"]' bun run dev
```

## Cache & Storage Configuration

The application uses **Unstorage** for a unified cache layer with multiple backend support:

| Backend    | Trigger                  | Use Case                     |
| ---------- | ------------------------ | ---------------------------- |
| LRU Cache  | Default (SQLite mode)    | Development, single-instance |
| Redis      | `REDIS_URL` set          | Production, multi-instance   |
| PostgreSQL | `DATABASE_TYPE=postgres` | Production without Redis     |

### Cache Environment Variables

| Variable    | Description                                          |
| ----------- | ---------------------------------------------------- |
| `REDIS_URL` | Redis connection URL (enables Redis cache & Pub/Sub) |

### Cache Backend Priority

```
1. Redis (if REDIS_URL is set)
   - Best for: Production with multiple instances
   - Supports: Cache + Pub/Sub

2. PostgreSQL (if DATABASE_TYPE=postgres)
   - Best for: Production without Redis
   - Supports: Cache only (no Pub/Sub)

3. LRU Cache (default)
   - Best for: Development, single-instance
   - Supports: Cache only (no Pub/Sub)
```

### Pub/Sub Requirements

> **Note**: While the application supports multiple backends for in-process events, **Redis is required** for cross-instance Pub/Sub (distributed). Other backends (PostgreSQL, LRU Cache) only support in-process events.

```bash
# Enable distributed Pub/Sub (requires Redis)
REDIS_URL=redis://localhost:6379 bun run dev

# For Upstash (serverless Redis)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379 bun run dev
```

The database path can be customized via environment variables:

```bash
# Use custom database location
SQLITE_URL=file:./custom/path/database.db bun run dev

# Use in-memory database for testing
SQLITE_URL=:memory: bun run dev
```

## E2E Testing Configuration

E2E configuration is centralized in `.e2e/config.ts` and consumed by both `playwright.config.ts` and test files.

| Variable          | Default                    | Description              |
| ----------------- | -------------------------- | ------------------------ |
| `E2E_HOST`        | `localhost`                | E2E test server host     |
| `E2E_PORT`        | `3000`                     | E2E test server port     |
| `E2E_BASE_URL`    | Dynamic                    | Full URL for E2E tests   |
| `BETTER_AUTH_URL` | `${E2E_BASE_URL}/api/auth` | Auth service URL for E2E |

```typescript
// .e2e/config.ts
const host = process.env.E2E_HOST || process.env.HOST || "localhost";
const port = process.env.E2E_PORT || process.env.PORT || "3000";

export const E2E_BASE_URL = process.env.E2E_BASE_URL || `http://${host}:${port}`;
export const E2E_HOST = host;
export const E2E_PORT = port;
```

## Environment Files

Create a `.env` file in the project root:

```bash
# .env
HOST=localhost
PORT=3000
```

## Setup

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

## Isomorphic Env Fetching

The project uses `src/config/env.ts` for type-safe environment variables that work in both client and server contexts:

```typescript
// src/env.ts
export const env = await _createEnv({
  client: {
    VITE_API_URL: t.String(), // Client-only vars
    DATABASE_NAME: t.String(), // Available on both client and server
  },
  server: {
    API_URL: t.String(), // Server-only vars
    BETTER_AUTH_URL: t.String(),
    BETTER_AUTH_SECRET: t.String(),
    SQLITE_URL: t.String(),
    PORT: t.Number(),
    REDIS_URL: t.Optional(t.String()),
  },
  runtimeEnv: () => ({
    VITE_API_URL: _getEnv("VITE_API_URL", ""),
    API_URL: _getEnv("API_URL", "http://localhost:3000/api"),
    BETTER_AUTH_URL: _getEnv("BETTER_AUTH_URL", "http://localhost:3000/api/auth"),
    BETTER_AUTH_SECRET: _getAuthSecret(),
    SQLITE_URL: _getEnv("SQLITE_URL", ""),
    PORT: parseInt(_getEnv("PORT", "3000"), 10),
  }),
});
```

### Database Setup

The database is configured via `SQLITE_URL`:

```bash
# Default location (file-based)
SQLITE_URL=file:.artifacts/tsse-elysia.db bun run db:migrate

# Custom location
SQLITE_URL=file:./custom/path/database.db bun run db:migrate

# In-memory (for testing)
SQLITE_URL=:memory: bun run seed
```

After setting `SQLITE_URL`, run migrations and seed:

```bash
bun run db:migrate
bun run db:seed
```

### Client Environment Variables

Client-side variables must be prefixed with `VITE_`:

```typescript
// Access in client code
import { env } from "~/_env";
import { logger } from "./logger";

logger.log(env.VITE_API_URL); // Available in browser
// env.BETTER_AUTH_SECRET would throw - server-only
```

Set `VITE_API_URL` for production or custom preview servers:

```bash
VITE_API_URL=http://custom-server:4000 bun run preview
```

### Server Environment Variables

Server-only variables are protected from client access:

```typescript
// Server-side code has full access
import { env } from "~/_env";
import { logger } from "./logger";

logger.log(env.API_URL); // Available on server
logger.log(env.BETTER_AUTH_SECRET); // Available on server
```

## Runtime Detection

The env module automatically detects the runtime:

- **Bun**: Uses `Bun.env`
- **Node.js**: Uses `process.env`
- **Deno**: Uses `Deno.env`
- **Browser**: Limited to client variables

## Usage

### Development

```bash
# Run on custom port
PORT=3000 bun run dev
# Or
bun run --env-file=.env dev

# Run on custom host
HOST=0.0.0.0 bun run dev
# Or
bun run --env-file=.env dev

# Both
HOST=0.0.0.0 PORT=3000 bun run dev
# Or
bun run --env-file=.env dev
```

### Production

```bash
# Build and run with custom port
bun run build && PORT=3000 bun run start
```

### Testing

Load tests and E2E tests also support these variables:

```bash
# Run load test on custom port
PORT=3000 bun run test:load
# Or
bun run --env-file=.env test:load

# Run E2E tests on custom host/port
HOST=localhost PORT=3000 bun run test:e2e
# Or
bun run --env-file=.env test:e2e
```

Or use `BASE_URL` for full URL override:

```bash
BASE_URL=http://localhost:3000 bun run test:load
# Or
bun run --env-file=.env test:load
```

### CI Environment

In GitHub Actions, E2E tests use these environment variables:

```yaml
env:
  E2E_HOST: "localhost" # Resolved to container IP dynamically
  E2E_PORT: "4173" # Preview server port
  BETTER_AUTH_SECRET: "your-secret-min-32-chars" # Required in production
```

The CI workflow resolves the container's host IP dynamically and sets `E2E_BASE_URL` and `BETTER_AUTH_URL` accordingly.

## Validation

Environment variables are validated at runtime using Elysia's type system:

- If validation fails, the app will throw an error with details
- In production, missing required variables will cause startup failure
- In development, missing optional variables use defaults with a warning

## Security

- Server-only variables (`BETTER_AUTH_SECRET`, `POSTGRES_URL`) are protected from client access
- Accessing server variables from the browser throws an error
- The env module uses a Proxy to enforce these boundaries