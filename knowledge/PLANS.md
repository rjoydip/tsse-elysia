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

| Phase | Area             | Status |
| ----- | ---------------- | ------ |
| 1–3   | Foundations      | ✅     |
| 4–5   | UI & UX          | ✅     |
| 7     | Infrastructure   | ✅     |
| 8     | Real-time        | ✅     |
| 9     | MCP              | ✅     |
| 10    | Data Strategy    | 📅     |
| 13    | Contract Testing | 📅     |
| Svc   | Service Layer    | ✅     |
| 11    | API Architecture | ✅     |
| 12    | Comptime         | ✅     |
| 14    | Docker Optimize  | ✅     |

---

## Active Focus

### Phase 10 – Data Evolution

- Vector + Graph DB
- Performance & scaling

### Phase 12 – Comptime Build-Time Computation ✅

**Completed:**

- Integrated `@lukeed/comptime` for build-time value computation
- Created `src/lib/comptime/` module:
  - `values.ts` - Raw constant values (role hierarchies, patterns, entities)
  - `index.ts` - Build-time computed exports using `comptime()`
- Integrated with Vite via `comptime/vite` plugin (`vite.config.ts`)
- Consolidated pagination cache (eliminates runtime computation for pages ≤20)
- Centralized 15+ build-time constants (roles, views, patterns, HTML entities, etc.)

**Benefits:**

- Zero runtime overhead for static values
- Regex patterns pre-compiled at build time
- Pagination cache pre-computed for common page counts
- Type-safe exports with JSDoc documentation

### Phase 14 – Docker Optimization (Scratch Runtime) ✅

**Completed:**

- Implemented multi-stage Dockerfile using scratch base for production
- Reduced image size from ~150-200MB to ~70-85MB
- Eliminated Alpine OS packages (minimal CVE surface)
- Added decision #030: Scratch-Based Docker Runtime
- Created Docker parsing utilities:
  - `src/lib/docker/types.ts` - Type definitions
  - `src/lib/docker/index.ts` - Parser utilities
- Unit tests: `test/lib/docker/index.test.ts`

### Phase 9 – User Management Dashboard ✅

**Completed:**

- User repository with findAll, findById, findByEmail, count methods
- Users API route with pagination and filtering
- Users dashboard page with data table
- Refresh button with loading state
- Async user count with skeleton in dashboard
- Unit tests for repository
- E2E tests for users page
- Add user dialog with password validation (strength indicator, match indicator)
- Username generation from name (handles special characters)
- Unit tests for form schemas (20 tests)

### Phase 11 – API Architecture Refactoring ✅

**Completed:**

- Implemented layered architecture (HTTP → Controller → Service → Repository)
- Created `src/controllers/` for HTTP-specific logic
- Created `src/repositories/` for ORM operations
- Refactored MCP API keys (moved ORM logic to repository, business logic to service)
- Refactored Settings API (profile, account, display, notifications)
- Added barrel files (index.ts) for all new layers
- All unit tests pass
- TypeScript typecheck passes
- Linter passes with 0 errors

**Structure:**

```sh
src/
├── routes/api/         # HTTP Layer (Elysia route definitions)
├── controllers/        # Controller Layer (session validation, request parsing)
├── services/           # Service Layer (business logic)
└── repositories/      # Repository Layer (ORM operations)
```

---

## Linked Execution Plans

- [Phase 9: MCP Server Plan](./plans/phase-9-mcp-server-plan.md)
- [Phase 7.1: Redis Implementation](./plans/phase-7.1-redis-implementation-plan.md)
- [Phase 8: Real-time Features](./plans/phase-8-realtime-features.md)
- [Phase 5.2: User Management Dashboard](./plans/phase-5.2-user-management-dashboard.md)
- [Phase 11: Database Refactoring](./plans/phase-11-db0-database-refactoring.md)
- [Phase 13: Contract Testing](./plans/phase-13-contract-testing-implementation-plan.md)

---

## Success Criteria

- Clear priorities at all times
- No duplication with execution plans
- Easy onboarding for new contributors
- System scales to enterprise workloads