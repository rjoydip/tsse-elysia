---
title: Project Overview
description: A full-stack TypeScript application demonstrating modern web development with TanStack Start, Elysia, and React 19.
---

## Project Overview

## Goals

A full-stack TypeScript application demonstrating modern web development with TanStack Start, Elysia, and React 19.

## Technology Stack

| Category   | Technology                              |
| ---------- | --------------------------------------- |
| Framework  | TanStack Start                          |
| Server     | Elysia                                  |
| Runtime    | Bun                                     |
| UI         | React 19                                |
| Styling    | Tailwind CSS v4                         |
| Cache      | Unstorage (Redis/PostgreSQL/LRU)        |
| Pub/Sub    | Redis-only (Bun native `RedisClient`)   |
| Validation | Zod v4                                  |
| Testing    | Bun (unit), Playwright (E2E), k6 (load) |
| Linting    | oxlint                                  |
| Formatting | oxfmt                                   |

## Project Structure

```bash
tsse-elysia/
├── src/
│   ├── assets/        # Static assets (images, icons)
│   ├── components/   # React components
│   │   ├── ui/       # shadcn/ui components
│   │   ├── layout/  # Layout components
│   │   ├── docs/    # Docs components
│   │   ├── settings/ # Settings components
│   │   └── ...
│   ├── config/       # Configuration
│   ├── context/     # React context providers
│   ├── features/    # Feature modules
│   │   ├── auth/    # Auth features
│   │   ├── dashboard/ # Dashboard feature
│   │   ├── users/   # Users feature
│   │   ├── tasks/   # Tasks feature
│   │   └── ...
│   ├── hooks/       # Custom React hooks
│   ├── lib/        # Library code
│   │   ├── auth/   # Auth (Better Auth)
│   │   ├── cache/  # Cache layer
│   │   ├── mcp/   # MCP server
│   │   └── ...
│   ├── middlewares/ # Middleware implementations
│   ├── plugins/   # Elysia plugins
│   ├── routes/    # File-based routing
│   │   ├── __root.tsx
│   │   ├── api/   # API routes
│   │   └── _authenticated/ # Protected routes
│   ├── services/  # Service layer
│   └── styles/    # CSS styles
├── test/          # Unit & component tests (Bun)
│   ├── components/ # Component tests
│   ├── fixtures/   # Test fixtures
│   ├── helpers/    # Test helpers
│   ├── scripts/    # Script tests
│   └── unit/       # Unit tests (config, lib, middleware, routes, ...)
├── .e2e/          # Playwright E2E tests
├── server.ts      # TanStack Start server
├── vite.config.ts # Vite configuration
└── docs/          # Documentation
```

## Features

- Server-Side Rendering (SSR) with TanStack Start
- File-based routing
- API endpoints via Elysia
- MCP endpoints under `/api/mcp/*` for external tool integration
- Type-safe development
- Hot Module Replacement (HMR)
- Load testing with k6
- E2E testing with Playwright