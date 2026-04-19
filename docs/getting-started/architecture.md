---
title: Architecture
description: System architecture and design patterns
---

## Architecture

This document describes the system architecture of the tsse-elysia project.

## Overview

The application follows a server-side rendering (SSR) architecture using TanStack Start with Elysia as the backend framework.

```bash
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ React 19    │  │ TanStack    │  │ TanStack Start          │  │
│  │ Components  │  │ Router      │  │ Client                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server (Bun/Node)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  TanStack Start Server                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ Vite Dev    │  │ Elysia      │  │ API Routes      │   │   │
│  │  │ Server      │  │ App         │  │ (/api/*)        │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Middlewares                           │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐   │   │
│  │  │ CORS      │ │ Helmet    │ │ Rate-Limit│ │ Vite    │   │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Client Layer

| Component        | File                   | Purpose                |
| ---------------- | ---------------------- | ---------------------- |
| React Components | `src/routes/*.tsx`     | UI components          |
| Router           | `src/router.tsx`       | TanStack Router config |
| Route Tree       | `src/routeTree.gen.ts` | Auto-generated routes  |

### 2. Server Layer

| Component    | File                       | Purpose                                    |
| ------------ | -------------------------- | ------------------------------------------ |
| Server Entry | `src/server.ts`            | TanStack Start entry with auth method gate |
| App Factory  | `src/server.ts`            | Elysia app with middlewares                |
| API Routes   | `src/routes/api/$.ts`      | API endpoints                              |
| Auth Routes  | `src/routes/api/auth/$.ts` | Auth endpoints (Better Auth)               |
| MCP Routes   | `src/routes/api/mcp/$.ts`  | MCP service routes and tool discovery      |

### 3. Configuration Layer

| Component | File                | Purpose                         |
| --------- | ------------------- | ------------------------------- |
| Config    | `src/config/env.ts` | Type-safe environment variables |
| Env       | `src/config/env.ts` | Type-safe environment variables |

### 4. Middleware Layer

| Middleware | File                            | Purpose              |
| ---------- | ------------------------------- | -------------------- |
| CORS       | `src/middlewares/cors.ts`       | Cross-Origin headers |
| Helmet     | `src/middlewares/helmet.ts`     | Security headers     |
| Rate Limit | `src/middlewares/rate-limit.ts` | Request throttling   |

## Data Flow

### Request Flow

1. **Client Request** → Browser sends HTTP request to server
2. **Server Entry** (`src/server.ts`) → Rejects unsupported methods for `/api/auth/*` (405), sets up Elysia app with middlewares
3. **Vite Middleware** (dev) or **Static** (prod) handles request
4. **CORS** → Validates cross-origin headers
5. **Helmet** → Adds security headers
6. **Rate Limit** → Checks request limits
7. **Route Handler** → Processes API or SSR route
8. **Response** → Returns JSON (API) or HTML (SSR)

### Environment Flow

1. **Load** → `src/_env.ts` loads at startup
2. **Validate** → Type-safe schema validation
3. **Runtime Detect** → Identifies Bun/Node/Deno
4. **Proxy** → Enforces client/server boundaries

## Configuration Hierarchy

```bash
package.json
    │
    ▼
vite.config.ts
    │
    ▼
src/config/index.ts (API_PREFIX, rateLimitConfig, corsConfig, helmetConfig)
    │
    ▼
src/config/env.ts (runtimeEnv)
    │
    ▼
src/server.ts (createApp with middleware)
    │
    ▼
src/routes/api/$.ts (API routes)
    │
    └── src/routes/api/mcp/$.ts (MCP routes)
```

## File Structure

```bash
src/
├── config/             # Central configuration
│   └── index.ts        # (APP_NAME, rate limits, CORS, helmet)
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   │   ├── accordion.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── collapsible.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   ├── auth/          # Auth components
│   │   ├── form/       # Auth form components
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── auth-guard.tsx
│   │   ├── branding.tsx
│   │   └── footer.tsx
│   ├── docs/          # Documentation components
│   ├── profile/       # Profile components
│   ├── settings/      # Settings components
│   ├── background/    # Background components
│   ├── header.tsx     # Common header
│   ├── footer.tsx     # Common footer
│   ├── branding.tsx   # Branding component
│   ├── code-highlight.tsx
│   └── theme/         # Theme components
│       ├── provider.tsx
│       ├── toggle.tsx
│       └── context.tsx
├── hooks/             # Custom React hooks
│   └── use-mobile.ts
├── lib/               # Library code
│   ├── auth/          # Better Auth
│   │   ├── index.ts   # Server auth instance
│   │   ├── client.ts  # Client auth hooks
│   │   └── session.ts # Session utilities
│   ├── mcp/           # MCP server
│   │   ├── server.ts
│   │   ├── auth.ts
│   │   ├── api-keys.ts
│   │   ├── rate-limit.ts
│   │   ├── transport.ts
│   │   ├── client/    # MCP client
│   │   └── tools/     # MCP tools
│   │       ├── catalog.ts
│   │       └── users.ts
│   ├── db/           # Database (Drizzle + SQLite/PostgreSQL)
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── redis/        # Storage & Pub/Sub
│   │   ├── index.ts   # Unstorage with Redis/Postgres/LRU backends
│   │   └── pubsub.ts  # Pub/Sub using Unstorage event system
│   ├── cache/        # Cache layer (Unstorage-backed)
│   │   └── index.ts   # Multi-backend cache support
│   ├── realtime/      # WebSocket realtime
│   ├── rate-limit/   # Rate limiting
│   ├── store/        # State management
│   │   ├── auth.ts
│   │   ├── preferences.ts
│   │   └── status.ts
│   ├── blog/         # Blog data
│   ├── changelog/    # Changelog data
│   └── logger.ts     # Structured logger built on Evlog
├── middlewares/       # Middleware implementations
│   ├── cors.ts
│   ├── helmet.ts
│   ├── rate-limit.ts
│   └── index.ts
├── plugins/           # Elysia plugins
├── router.tsx         # TanStack Router
├── routeTree.gen.ts  # Auto-generated routes
├── routes/           # TanStack Start routes
│   ├── __root.tsx
│   ├── index.tsx     # Home route
│   ├── account/     # Account routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── verify-email.tsx
│   ├── profile.tsx   # Profile page
│   ├── settings.tsx  # Settings page
│   ├── docs.tsx     # Documentation layout
│   ├── docs.$.tsx   # Documentation catch-all
│   ├── blog.tsx     # Blog routes
│   ├── changelog.tsx # Changelog routes
│   ├── status.tsx    # Health monitoring dashboard
│   └── api/         # API routes
│       ├── $.ts
│       ├── auth/    # Auth routes
│       │   ├── $.ts
│       │   └── modules/
│       ├── mcp/    # MCP routes
│       │   ├── $.ts
│       │   ├── keys.ts
│       │   └── modules/
│       └── modules/ # API modules
├── server.ts         # Server entry point
├── types/            # TypeScript types
│   ├── evlog.ts      # Evlog type definitions
│   └── subscription.ts
├── app.css          # Global styles (Tailwind CSS + shadcn theme)
└── router.tsx       # TanStack Router configuration
```

## SSR/CSR Strategy

- **Initial Load**: Server-side rendered HTML
- **Navigation**: Client-side navigation via TanStack Router
- **API Calls**: Server functions via TanStack Start
- **Hydration**: React 19 automatic hydration

## Security

- Server-only env variables protected from client
- CORS configured for allowed origins
- Helmet adds security headers
- Rate limiting prevents abuse