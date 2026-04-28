---
title: API Reference
description: API endpoints and server routes reference
---

## API Reference

### OpenAPI (interactive)

- **[Interactive API docs (`/api/reference`)](/api/reference)** — Scalar UI for all HTTP routes (app, auth, MCP).
- **[OpenAPI JSON (`/api/reference/json`)](/api/reference/json)** — Machine-readable spec.
- **Hub (app + auth)**: [API references](/docs/api/api-references) — entry points for application and auth APIs.
- **Details**: [OpenAPI reference](/docs/api/reference) — notes and base path.

## Server Routes

This project uses TanStack Start with file-based routing. Routes are defined in `src/routes/`.

### Current Routes

| Method | Path                      | Description                       |
| ------ | ------------------------- | --------------------------------- |
| GET    | `/`                       | Home page (SSR)                   |
| GET    | `/account/*`              | Account routes                    |
| GET    | `/api`                    | API root endpoint                 |
| GET    | `/api/*`                  | API catch-all                     |
| GET    | `/api/health`             | Health check                      |
| GET    | `/api/auth/*`             | Better Auth API                   |
| GET    | `/api/mcp/*`              | MCP API endpoints                 |
| GET    | `/api/mcp/tools`          | MCP tool discovery                |
| GET    | `/api/mcp/health`         | MCP health and connection status  |
| GET    | `/api/database/heartbeat` | Database heartbeat liveness check |
| GET    | `/blog/*`                 | Blog routes                       |
| GET    | `/changelog/*`            | Changelog routes                  |
| GET    | `/docs/*`                 | Docs routes                       |
| GET    | `/profile`                | Profile page                      |
| GET    | `/settings/*`             | Settings routes                   |
| GET    | `/status`                 | Health monitor                    |

### API Architecture

The API follows a layered architecture:

```
HTTP Layer (routes/api/) → Controller Layer (controllers/) → Service Layer (services/) → Repository Layer (repositories/)
```

- **HTTP Layer**: Route definitions in `src/routes/api/`
- **Controller Layer**: Session validation, request parsing in `src/controllers/`
- **Service Layer**: Business logic in `src/services/`
- **Repository Layer**: ORM operations in `src/repositories/`

See [Architecture Guide](../../docs/getting-started/architecture.md#api-architecture) for full details.

### Route File Structure

```bash
src/routes/
  __root.tsx        # Root route (layout)
  index.tsx         # Home page (/)
  account/          # Account routes
    login.tsx  # Login page (/account/login)
    register.tsx # Register page (/account/register)
    forgot-password.tsx # Forgot password page (/account/forgot-password)
    verify-email.tsx # Email verification (/account/verify-email)
  api/              # API routes (HTTP Layer)
    $.ts           # API catch-all route
    auth/          # Auth routes (Better Auth)
      $.ts
    mcp/           # MCP routes
      -core.ts
      -keys.ts     # Uses controllers/mcp/keys.controller.ts
    settings/       # Settings routes
      -profile.ts   # Uses controllers/settings/controller.ts
      -account.ts
      -display.ts
      -notifications.ts
```

### API Route Implementation

The API uses Elysia with the following structure:

```typescript
// src/routes/api/$.ts
import { Elysia } from "elysia";
import { createFileRoute } from "@tanstack/react-router";
import { API_PREFIX, APP_NAME } from "~/config";
import { composedMiddleware, errorFn, traceFn } from "~/middlewares";

export const apiRoutes = new Elysia({ name: "root.api", prefix: API_PREFIX })
  .use(composedMiddleware({ openAPP_NAME: "API" }))
  .trace(traceFn)
  .onError(errorFn)
  .state("name", APP_NAME)
  .get("/", ({ store: { name }, set }) => {
    set.headers["Content-Type"] = "text/plain; charset=utf-8";
    return `Welcome to ${name} Service`;
  })
  .get("/health", async ({ store: { name } }) => ({
    name,
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  .get("/database/heartbeat", () => {
    const heartbeat = getDatabaseHeartbeat();
    return new Response(JSON.stringify(heartbeat), {
      status: heartbeat.status === "healthy" ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    });
  });

const handle = ({ request }: { request: Request }) => apiRoutes.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
    },
  },
});
```

### Adding a New Route

Create a new file in `src/routes/`:

```typescript
// src/routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return <div>About Us</div>;
}
```

### Adding an API Route

Extend the API in `src/routes/api/$.ts` or create a new file in `src/routes/api/`:

```typescript
// src/routes/api/users.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/users")({
  loader: async () => {
    return {
      users: [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ],
    };
  },
});
```

### Using Loaders in Components

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/users")({
  component: UsersPage,
  loader: async () => {
    return { users: [{ id: 1, name: "John" }] };
  },
});

function UsersPage() {
  const { users } = Route.useLoaderData();
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Client API

### Router

```typescript
import { getRouter } from "~/router";

const router = getRouter();
```

### Links

```typescript
import { Link } from "@tanstack/react-router";

<Link to="/">Home</Link>
```

## Error Handling

- `defaultErrorComponent` - 500 errors
- `defaultNotFoundComponent` - 404 errors

Configure in `src/router.tsx`:

```typescript
const router = createRouter({
  defaultErrorComponent: () => <div>Internal Server Error</div>,
  defaultNotFoundComponent: () => <div>Not Found</div>,
});
```

## Configuration

### App Config (`src/config/index.ts`)

Central configuration for the application:

```typescript
export const API_PREFIX = `/api`;
export const APP_NAME = "TSS ELYSIA";
export const statusPageConfig = {
  manualRefreshCooldownMs: 10000, // Prevents refresh-button spam on /status
};

export const appConfig: ElysiaConfig<any> = {
  normalize: true,
  prefix: "",
  nativeStaticResponse: true,
  websocket: { idleTimeout: 30 },
};

export const rateLimitConfig = {
  duration: 60_000,
  max: 100,
};

export const corsConfig = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Request-Id", "X-Response-Time"],
  credentials: true,
  maxAge: 86400,
};
```

### Environment Variables (`src/config/env.ts`)

Type-safe environment variable handling:

```typescript
export const env = await _createEnv({
  client: { VITE_API_URL: t.String() },
  server: {
    API_URL: t.String(),
    BETTER_AUTH_SECRET: t.String(),
    SQLITE_URL: t.String(),
    PORT: t.Number(),
  },
  runtimeEnv: () => ({
    VITE_API_URL: _getEnv("VITE_API_URL", ""),
    API_URL: _getEnv("API_URL", "http://localhost:3000/api"),
    BETTER_AUTH_SECRET: _getAuthSecret(),
    SQLITE_URL: _getEnv("SQLITE_URL", ""),
    PORT: parseInt(_getEnv("PORT", "3000"), 10),
  }),
});
```