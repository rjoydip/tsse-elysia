---
title: Authentication
description: Authentication and authorization with Better Auth
---

## Authentication

This project uses [Better Auth](https://better-auth.com) for authentication and authorization, integrated with Drizzle ORM for database storage.

## Setup

### Environment Variables

Add the following to your `.env` file:

```bash
# Required - Generate with: bunx auth secret
BETTER_AUTH_SECRET=your-32-char-secret-key

# Optional - Auth base URL (defaults to http://localhost:3000/api/auth)
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Database Configuration
DATABASE_TYPE=sqlite
SQLITE_URL=file:.artifacts/tsse-elysia.db
```

### Database Setup

```bash
# Generate and run migrations
bun run db:generate
bun run db:migrate

# Seed initial data
bun run db:seed
```

## Configuration

The auth system is configured in `src/lib/auth/index.ts`:

- **Email/Password**: Enabled with optional email verification
- **Session**: 7-day expiry, 24-hour update age, 5-minute cookie cache
- **Database**: Drizzle adapter with SQLite
- **Password Hashing**: Argon2id (memory: 64MiB, iterations: 3, parallelism: 4)
- **Trusted Origins**: `BETTER_AUTH_URL` and its base origin (e.g., `http://localhost:3000`)
- **IP Header Resolution**: Better Auth uses trusted proxy headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`) for rate-limiting and audit metadata.

## Auth UI State (TanStack Store)

Auth form UI state is centralized in `src/lib/store/auth.ts` using TanStack Store.

- **Forms Covered**: Login, Register, Forgot Password
- **Centralized State**: `isSubmitting`, `submitErrorMessage` (per form)
- **UX Behavior**:
  - Submit buttons show loading state (`Signing in...`, `Creating account...`, `Sending...`) until the related API request resolves.
  - Inputs and submit actions are disabled while requests are in flight.
  - Errors are surfaced through toast messages (no inline submit error block).

## Subscription Tiers

Users are assigned subscription tiers that control API rate limits:

| Tier        | Rate Limit | Duration |
| ----------- | ---------- | -------- |
| Free        | 100        | 60s      |
| Contributor | 1,000      | 60s      |
| Enterprise  | 10,000     | 60s      |

## API Endpoints

Better Auth provides these endpoints under `/api/auth`. Only `GET`, `POST`, `PUT`, and `DELETE` methods are supported; unsupported methods return `405 Method Not Allowed`.

| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| POST   | `/api/auth/sign-up/email` | Register new user      |
| POST   | `/api/auth/sign-in/email` | Login with credentials |
| GET    | `/api/auth/get-session`   | Get current session    |
| POST   | `/api/auth/sign-out`      | Logout user            |
| GET    | `/api/auth/list-sessions` | List active sessions   |

Unsupported HTTP methods (e.g., `PATCH`) are rejected at the server entry point (`src/server.ts`) before reaching the auth handler.

### Request Requirements

All auth API requests must include:

- **`Origin` header**: Must match a trusted origin (e.g., `http://localhost:3000`)
- **`Content-Type: application/json`**: Required for POST requests (including empty-body requests like sign-out)

### Error Responses

| Status | Code                     | Cause                         |
| ------ | ------------------------ | ----------------------------- |
| 401    | `UNAUTHORIZED`           | Invalid credentials           |
| 403    | `FORBIDDEN`              | Missing or untrusted Origin   |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | Missing Content-Type header   |
| 422    | `UNPROCESSABLE_ENTITY`   | Duplicate email or validation |

## Usage

### Via API (HTTP)

```typescript
// Sign up
const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "secure-password",
    name: "John Doe",
  }),
});

// Sign in
const login = await fetch("http://localhost:3000/api/auth/sign-in/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "secure-password",
  }),
});
```

### Via Auth API (Server-side)

```typescript
import { auth } from "~/lib/auth";

// Sign up
const result = await auth.api.signUpEmail({
  body: {
    email: "user@example.com",
    password: "secure-password",
    name: "John Doe",
  },
});

// Sign in
const login = await auth.api.signInEmail({
  body: {
    email: "user@example.com",
    password: "secure-password",
  },
});

// Get session
const session = await auth.api.getSession({
  headers: request.headers,
});

// Sign out
await auth.api.signOut({
  headers: request.headers,
});
```

## Testing

### Unit Tests

```bash
bun test test/routes/api/auth/$.test.ts test/lib/store/auth.test.ts
```

Tests cover: sign-up/sign-in route behavior, duplicate email handling path, auth UI store state transitions, session management, sign-out, and handler integration.

### E2E Tests

```bash
bun run test:e2e -- .e2e/routes/auth.spec.ts .e2e/auth.spec.ts
```

E2E tests cover auth UI rendering and full HTTP auth flows (including CORS headers, Origin validation, and error responses).