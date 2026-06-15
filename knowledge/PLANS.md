# Project Roadmap & Strategy

## Overview

Production-grade full-stack TypeScript platform using:

- TanStack Start
- Elysia
- React 19

Core focus:

- Security-first architecture
- Scalable infrastructure
- Enterprise-ready features
- MCP-based extensibility

---

## Strategic Pillars

### 1. Security

- Strong authentication (Better Auth)
- RBAC & multi-tenancy
- Audit logging & secure infra

### 2. Developer Experience

- Bun-based fast workflows
- Strict type safety
- High test coverage

### 3. Scalability

- Multi-database architecture
- Redis + caching
- Horizontal scaling readiness

### 4. Extensibility

- MCP server (external integrations)
- API-first design

---

## Roadmap Status

| Phase | Area                            | Status |
| ----- | ------------------------------- | ------ |
| 0–2   | Setup & Standards               | ✅     |
| 3     | Auth & Security                 | 🚧     |
| 4     | UI & Component Library          | ✅     |
| 5     | Email & Notifications           | 🚧     |
| 6     | Dashboard & Analytics           | ✅     |
| 7     | Infrastructure & DevOps         | ✅     |
| 8     | Real-time Features              | ✅     |
| 9     | MCP Server                      | 🚧     |
| 10    | Database Strategy               | ✅     |
| 11    | API Architecture                | ✅     |
| 12    | Comptime Build-Time Opt         | ✅     |
| 13    | Contract Testing                | 📅     |
| 14    | Docker Optimization             | ✅     |
| 15    | Dashboard Real Data             | ✅     |
| 16    | Better Result Integration       | 🚧     |
| 17    | Dashboard UI Polish             | ✅     |
| 18    | Dashboard Stability & HMR Fixes | ✅     |
| 19    | Production Seed & Seeding       | ✅     |
| 20    | Dynamic RBAC                    | ✅     |
| 21    | Nightly Dev Build Workflow      | ✅     |
| 22    | Layered RBAC Refactoring        | ✅     |
| 23    | RBAC Overhaul: Controllers      | ✅     |
| 24    | Bruno API Testing               | ✅     |
| 25    | Maizzle Email Templates         | ✅     |
| 26    | Analytics & Telemetry           | 📅     |
| 27    | Scalability & Enterprise        | 📅     |

---

## Completed Phases (Compressed)

> Detailed descriptions moved to roadmaps.md. Key highlights below.

### Phases 0-2: Setup & Standards ✅

- Project initialization, Bun, TypeScript, Elysia, TanStack Start, React 19.
- CI/CD pipeline (lint, typecheck, test, build, release). Security scanning (Trivy).
- AI/LLM coding guidelines, AGENTS.md, PR templates, changelogen release automation.

### Phase 4: UI & Component Library ✅

- shadcn/ui integration with Tailwind CSS v4 — 30+ components.
- TanStack Form, TanStack Table, Markdown renderer (Shiki).

### Phase 6: Dashboard & Analytics ✅

- Full dashboard with metrics, analytics, recent activity, overview charts.
- Multiple iterations: real data, UI polish, stability/HMR fixes, code review.
- Animated dashboard with `AnimatedNumber` component and role-based views.

### Phase 7: Infrastructure & DevOps ✅

- Docker + Docker Compose (multi-stage, scratch base, ~70-85MB).
- Redis (cache, pub/sub, health checks). CI/CD pipeline.
- Nightly dev build workflow (Phase 21).

### Phase 8: Real-time Features ✅

- Authenticated WebSockets, heartbeat, rate limiting, presence tracking.
- Real-time notifications and connection store.

### Phase 10: Database Strategy ✅

- PostgreSQL + SQLite (DB0 abstraction), read replicas (round-robin).
- Health checks, migration system, PGlite (WASM PostgreSQL).

### Phase 11: API Architecture ✅

- Layered architecture (HTTP → Controller → Service → Repository).
- Full controller/service/repository layers for roles, users, settings, MCP keys.

### Phase 12: Comptime Build-Time Optimization ✅

- `@lukeed/comptime` for build-time value computation.
- Pagination cache pre-computed, regex patterns compiled at build time.

### Phase 14: Docker Optimization ✅

- Multi-stage Dockerfile, scratch base, reduced image size ~70-85MB.
- Docker parsing utility library with unit tests.

### Phase 19: Production Seed & Seeding ✅

- `--prod` flag (admin-only seeding), dev mode seeds 4 + 100 fake users.
- Deterministic output via `faker.seed()`, graph-friendly timestamps.

### Phase 20: Dynamic RBAC ✅

- DB-driven permissions (`user_roles` junction table, `PermissionResolver`).
- Centralized authorization middleware (`requireAuth`, `requirePermission`).
- Full Roles & Permissions management dashboard UI.
- DB-powered sidebar filtering.

### Phase 22-23: RBAC Overhaul & Controllers ✅

- Migrated all route logic to controllers/services (roles, users, settings, MCP).
- Test setup fix (in-memory DB migrations).

### Phase 24: Maizzle Email Template Tooling ✅

- Standalone Maizzle project at `tools/email-templates/`.
- 3 transactional email templates (welcome, verify-email, password-reset).
- 28 unit tests. Two consumption paths: pre-built HTML + runtime `render()` API.

### Phase 25: Bruno API Testing ✅

- Bruno workspace with 8 API domain collections. CI workflow.
- Collection generation script from OpenAPI spec.

---

## Active Focus

### Phase 3: Auth & Security 🚧

**Goal:** Complete authentication and authorization features beyond the basics.

**Completed:**

- [x] Better Auth integration (server + client)
- [x] Email/password auth flows
- [x] Session management (view/revoke)
- [x] Social login (Google OAuth, GitHub OAuth)
- [x] Rate limiting + CORS + Helmet
- [x] Email verification (config-ready)

**Remaining:**

- [ ] Two-Factor Authentication (TOTP)
- [ ] Organization & Multi-tenancy support

### Phase 5: Email & Notifications 🚧

**Goal:** Implement transactional email sending and complete the notification system.

**Completed:**

- [x] Maizzle email template tooling (3 templates ready)
- [x] Email preferences UI and database table
- [x] Real-time WebSocket notifications (in-memory)

**Remaining:**

- [ ] Transactional email sending service via Resend
- [ ] Wire templates to auth flows (welcome, verify-email, password-reset)

### Phase 9: MCP Server 🚧

**Goal:** Enhance MCP server with sandboxing and SDK support.

**Completed:**

- [x] MCP server implementation
- [x] Tool schema + discovery
- [x] API Key management and rate limiting
- [x] MCP E2E + unit tests

**Remaining:**

- [ ] Tool execution sandboxing (timeout wrapper)
- [ ] MCP client SDK

### Phase 16: Better Result Integration 🚧

**Goal:** Migrate all repositories/services/controllers to use tagged Result types.

**Completed:**

- [x] `better-result` dependency + `src/lib/result.ts`
- [x] Tagged errors (DatabaseError, NotFoundError, etc.)
- [x] Refactored MCP API keys + Settings profile repository/service/controller

**Remaining:**

- [ ] Refactor remaining repositories (account, display, notifications)
- [ ] Update services, controllers, middlewares, config, plugins

---

## Linked Execution Plans

- [Phase 9: MCP Server Plan](./plans/phase-9-mcp-server-plan.md)
- [Phase 7.1: Redis Implementation](./plans/phase-7.1-redis-implementation-plan.md)
- [Phase 8: Real-time Features](./plans/phase-8-realtime-features.md)
- [Phase 5.2: User Management Dashboard](./plans/phase-5.2-user-management-dashboard.md)
- [Phase 11: Database Refactoring](./plans/phase-11-db0-database-refactoring.md)
- [Phase 13: Contract Testing](./plans/phase-13-contract-testing-implementation-plan.md)
- [Phase 15: Replace Fake Dashboard Analytics with Real User Data](./plans/phase-15-dashboard-real-user-data.md)
- [Phase 21: Nightly Dev Build Workflow](./.github/workflows/nightly.yml)

---

## Success Criteria

- Clear priorities at all times
- No duplication with execution plans
- Easy onboarding for new contributors
- System scales to enterprise workloads