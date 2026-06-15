# Project Roadmap

This document outlines the high-level roadmap and progress for the **tsse-elysia** project. It is based on the comprehensive [PLANS.md](../../knowledge/PLANS.md) and tracks the evolution of the platform from initial setup to enterprise-ready status.

## Status Overview

| Phase  | Milestone                  | Status         |
| :----- | :------------------------- | :------------- |
| **0**  | Setup & Standards          | ✅ Completed   |
| **1**  | Preparation                | ✅ Completed   |
| **2**  | Verification               | ✅ Completed   |
| **3**  | Auth & Security            | 🚧 In Progress |
| **4**  | UI & Component Library     | ✅ Completed   |
| **5**  | Email & Notifications      | 🚧 In Progress |
| **6**  | Dashboard & Analytics      | ✅ Completed   |
| **7**  | Infrastructure & DevOps    | ✅ Completed   |
| **8**  | Real-time Features         | ✅ Completed   |
| **9**  | MCP Server                 | 🚧 In Progress |
| **10** | Database Strategy          | ✅ Completed   |
| **11** | API Architecture           | ✅ Completed   |
| **12** | Comptime Build-Time Opt    | ✅ Completed   |
| **13** | Contract Testing           | ⏳ Planned     |
| **14** | Docker Optimization        | ✅ Completed   |
| **15** | Dashboard Real Data        | ✅ Completed   |
| **16** | Better Result Integration  | 🚧 In Progress |
| **17** | Dashboard UI Polish        | ✅ Completed   |
| **18** | Dashboard Stability & HMR  | ✅ Completed   |
| **19** | Production Seed & Seeding  | ✅ Completed   |
| **20** | Dynamic RBAC               | ✅ Completed   |
| **21** | Nightly Dev Build Workflow | ✅ Completed   |
| **22** | Layered RBAC Refactoring   | ✅ Completed   |
| **23** | Bruno API Testing          | ✅ Completed   |
| **24** | Maizzle Email Templates    | ✅ Completed   |
| **25** | API Request Coalescing     | ⏳ Planned     |
| **26** | Analytics & Telemetry      | ⏳ Planned     |
| **27** | Scalability & Enterprise   | ⏳ Planned     |

---

## 🟢 Completed Milestones

### Phase 0-2: Foundation

- Established development standards and AI/LLM guidelines.
- Automated project initialization and release processes (changelogen, release workflow).
- Comprehensive security audits (Trivy), lint, format, typecheck, and unit/E2E testing baselines.

### Phase 4: UI & Component Library

- shadcn/ui integration with Tailwind CSS v4 — 30+ components (Button, Card, Form, Table, Dialog, etc.).
- TanStack Form integration and Markdown renderer (Shiki).
- Admin and User dashboards with role-based views.

### Phase 6: Dashboard & Analytics

- Full dashboard with metrics, analytics, recent activity, and overview charts.
- Real user data (replaced all `Math.random()` mock data).
- Animated dashboard (staggered entrance animations, `AnimatedNumber` component).
- Role-based views (admin/manager/cashier/user).
- Recent users with infinite scroll pagination.
- Multiple phases of polish, stability fixes, and HMR safety.

### Phase 7: Infrastructure & DevOps

- Docker + Docker Compose (multi-stage Dockerfile, scratch base for production).
- Redis (cache, pub/sub, health checks, connection store).
- CI/CD pipeline (lint, typecheck, test, build, security scan, release).
- Nightly dev build workflow (`cron: 0 0 * * *`, prerelease artifacts, workflow pruning).

### Phase 8: Real-time Features

- Authenticated WebSockets for live notifications and presence indicators.
- Secure connection handshake, heartbeat, and rate limiting.
- Real-time notifications and user presence tracking.

### Phase 10: Database Strategy

- PostgreSQL + SQLite support (conditional via `DATABASE_TYPE` env).
- Read replicas with round-robin load balancing.
- DB0 database abstraction layer.
- Health checks and migration system.

### Phase 11: API Architecture

- Layered architecture (HTTP → Controller → Service → Repository).
- Full controller layer for roles, users, settings (profile/account/display/notifications), and MCP keys.
- Services for business logic; repositories for ORM operations.

### Phase 12: Comptime Build-Time Optimization

- `@lukeed/comptime` integration for build-time value computation.
- Pagination cache pre-computed for common page counts.
- Regex patterns and role hierarchies pre-compiled at build time.

### Phase 14: Docker Optimization

- Multi-stage Dockerfile using scratch base for production runtime.
- Reduced image size ~70-85MB (from ~150-200MB).
- Docker parsing utility library with unit tests.

### Phase 15-18: Dashboard Real Data, UI Polish, Stability, HMR Fixes

- Replaced all `Math.random()` mock data with real DB queries.
- `AnimatedNumber` component with configurable presets.
- HMR-safe database/cache init, client-safe hooks, server-only import isolation.
- Full-page skeleton, unhandled error responses, auth sync race fix.

### Phase 19: Production Seed & Environment-Aware Seeding

- `--prod` flag for production mode (admin-only seeding).
- Dev mode seeds 4 static users + 100 fake users with graph-friendly timestamps.
- Deterministic output via `faker.seed()`.

### Phase 20: Dynamic RBAC

- DB-driven permissions with `user_roles` junction table.
- Centralized authorization middleware (`requireAuth`, `requireRole`, `requirePermission`).
- Full Roles & Permissions management dashboard UI.
- DB-powered sidebar filtering with sessionStorage caching.

### Phase 21: Nightly Dev Build Workflow

- Scheduled `cron: 0 0 * * *` + manual trigger.
- Quality checks, unit tests (coverage), E2E tests, production build.
- Prerelease creation with version scheme `0.0.0-dev.YYYYMMDD.<short-sha>`.

### Phase 22-23: RBAC Overhaul & Layered Architecture

- Migrated all remaining route logic from monolithic inline handlers to controllers/services.
- Roles, Settings (profile/account/display/notifications), Users, MCP controllers.
- Test setup fix (in-memory DB migrations via `sqliteClient.execute()`).

### Phase 24: Maizzle Email Template Tooling

- Standalone Maizzle project at `tools/email-templates/` with its own `package.json`.
- 3 transactional email templates: welcome, verify-email, password-reset.
- Custom brand colors, reusable layout component, email-optimized CSS transformers.
- Two consumption paths: pre-built HTML (`bun run email:build`) and runtime `render()` API.
- 28 unit tests for template structure, config, and build output.

### Phase 25: Bruno API Testing

- Bruno workspace with collections for 8 API domains.
- Local and CI environment files.
- Collection generation script from OpenAPI spec.
- CI workflow running smoke tests against preview server.

---

## 🟡 Active Development

### Phase 3: Auth & Security

- [x] Better Auth integration (server + client)
- [x] Email/password auth flows
- [x] Session management (view/revoke)
- [x] Social login (Google OAuth, GitHub OAuth)
- [x] Rate limiting + CORS + Helmet
- [x] Email verification (config-ready)
- [ ] Two-Factor Authentication (TOTP)
- [ ] Organization & Multi-tenancy support

### Phase 5: Email & Notifications

- [x] Maizzle email template tooling (3 transactional templates ready)
- [x] Email preferences UI and database table (`user_settings_notifications`)
- [x] Real-time WebSocket notifications (in-memory)
- [ ] Transactional email sending service via Resend
- [ ] Wire templates to auth flows (welcome, verify-email, password-reset)

### Phase 9: MCP Server

- [x] MCP server implementation for external integrations
- [x] Tool schema + discovery
- [x] API Key management and rate limiting
- [x] MCP E2E + unit tests
- [ ] Tool execution sandboxing (timeout wrapper)
- [ ] MCP client SDK

### Phase 16: Better Result Integration

- [x] `better-result` dependency and `src/lib/result.ts`
- [x] Tagged errors (DatabaseError, NotFoundError, ValidationError, etc.)
- [x] Refactored MCP API keys + Settings profile repository/service/controller
- [ ] Refactor remaining repositories (account, display, notifications)
- [ ] Update services, controllers, middlewares, config, plugins

---

## 🔵 Future Roadmap

### Phase 26: Analytics & Telemetry

- Error tracking (Sentry or similar APM).
- Performance monitoring and observability dashboards.
- Structured event logging and metrics collection.

### Phase 27: Scalability & Enterprise

- Database migration to PostgreSQL (production readiness).
- Horizontal scaling with connection pooling (pgBouncer).
- Circuit breaker patterns and graceful degradation.
- CDN + asset optimization.
- API request coalescing.

### Phase 13: Contract Testing

- Implementation of **Pact** for consumer-driven contract testing.
- Ensuring frontend/backend parity through automated schema verification.

---

> [!TIP]
> This roadmap is a living document. For detailed task breakdowns, refer to the [Internal Plan](../../knowledge/PLANS.md).