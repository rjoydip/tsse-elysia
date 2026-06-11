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

| Phase | Area                                | Status |
| ----- | ----------------------------------- | ------ |
| 1–3   | Foundations                         | ✅     |
| 4–5   | UI & UX                             | ✅     |
| 6     | Dashboard                           | ✅     |
| 7     | Infrastructure                      | ✅     |
| 8     | Real-time                           | ✅     |
| 9     | MCP                                 | ✅     |
| 10    | Data Strategy                       | 📅     |
| 13    | Contract Testing                    | 📅     |
| Svc   | Service Layer                       | ✅     |
| 11    | API Architecture                    | ✅     |
| 12    | Comptime                            | ✅     |
| 14    | Docker Optimize                     | ✅     |
| 15    | Dashboard Real Data                 | ✅     |
| 17    | Dashboard UI Polish                 | ✅     |
| 18    | Dashboard Stability & HMR Fixes     | ✅     |
| 19    | Production Seed & Env-Aware Seeding | ✅     |
| 20    | Dashboard Code Review Fixes         | ✅     |
| 21    | Nightly Dev Build Workflow          | ✅     |
| 22    | Dynamic RBAC                        | ✅     |
| 23    | Layered RBAC Refactoring            | ✅     |
| 24    | RBAC Overhaul: Roles, Settings,     | ✅     |
|       | Profile, Users Controllers          |        |

---

## Completed Phases

### Phase 21 – Nightly Dev Build Workflow ✅

**Completed:**

- Created `.github/workflows/nightly.yml` with scheduled `cron: 0 0 * * *` + manual trigger
- Runs quality checks, unit tests (coverage), E2E tests, and production build
- Creates/updates a "Nightly" GitHub Release (prerelease) with build artifacts
- Version scheme: `0.0.0-dev.YYYYMMDD.<short-sha>` (unique daily, no semver bump)
- Automatically prunes old workflow runs (keeps last 30)
- Decision doc: `DECISIONS.md:decision-040-nightly-dev-build-workflow`
- CI/CD docs updated in `docs/infra/ci-cd.md` with full workflow details

**Benefits:**

- Daily regression detection via full test suite
- Pre-built artifacts available without formal releases
- Consistent cadence independent of PR merges
- Manual trigger available for ad-hoc dev builds

## Active Focus

### Phase 25 – Bruno API Testing & Devkit Developer Toolkit ✅

**Goal:** Add Bruno API client (collection-based API testing & documentation) and Devkit (developer administration CLI/MCP toolkit) to the project, enabling API validation in CI and agent-driven developer operations.

**Completed:**

#### Phase 25.1 – Bruno Workspace & API Collections ✅

- Created Bruno workspace at `.bruno/` with collection structure for 8 API domains: auth, users, roles, settings, tasks, mcp, dashboard, system
- Created environment files for local (`localhost:3000`) and CI (`localhost:4173`)
- Created YAML request files with OpenCollection format (Git-friendly), each with request body, headers, and response tests
- Created `scripts/generate-bruno-collections.ts` to regenerate collections from OpenAPI spec using `@usebruno/converters`
- Created `.github/workflows/bruno-api.yml` CI workflow running `bru run --env ci` against preview server
- All 10 smoke-tagged requests pass end-to-end (including auth with Better Auth session extraction)

#### Phase 25.2 – Devkit Developer Toolkit ✅

- Created `tools/devkit/` with RPC modules (`db.ts`, `cache.ts`, `system.ts`) using `defineRpcFunction` from `devframe`
- Created CLI entry (`tools/devkit/cli.ts`) with 5 commands: `db:health`, `db:stats`, `cache:health`, `cache:stats`, `system:info`
- Created MCP server (`tools/devkit/mcp.ts`) registering 5 developer tools via `@modelcontextprotocol/sdk`
- CLI validated: `bun run devkit db:health` returns healthy DB status, `bun run devkit system:info` returns runtime details
- Devkit is supplementary — existing MCP server in `src/lib/mcp/` remains untouched

#### Phase 25.3 – Tests & Quality ✅

- 21 new unit tests (devkit RPC definitions + Bruno collection structure)
- 1583 total tests pass, lint clean, typecheck clean
- Bruno E2E smoke tests: 10/10 requests pass, 10/10 tests pass

**Files Created:**

- `.bruno/workspace.yml`, `.bruno/environments/local.yml`, `.bruno/environments/ci.yml`, `.bruno/collections/tsse-elysia/*/*.yml` (14 collection files)
- `.github/workflows/bruno-api.yml` (CI workflow)
- `scripts/generate-bruno-collections.ts` (collection generation script)
- `tools/bruno-converters.d.ts` (Bruno converters type declarations)
- `tools/devkit/index.ts`, `tools/devkit/cli.ts`, `tools/devkit/mcp.ts`, `tools/devkit/rpc/db.ts`, `tools/devkit/rpc/cache.ts`, `tools/devkit/rpc/system.ts`
- `test/unit/devkit/definition.test.ts`, `test/unit/devkit/rpc.test.ts`
- `test/scripts/generate-bruno.test.ts` (Bruno collection structure tests)

**Devframe Note:** `devframe` v0.5.4 has known packaging issues — `defineDevframe` not exported from main entry, `h3` adapter broken. Devkit uses `defineRpcFunction` for RPC definitions only; CLI and MCP wiring done manually with existing SDK.

## Active Focus

### Phase 15 – Dashboard Real User Data ✅

**Completed:**

- Added `countByStatus`, `countByRole`, `findRecent`, `getMonthlyRegistrations`, `getUsersGroupedByRole`, `getUsersGroupedByStatus` methods to `UserRepository`
- Replaced all `Math.random()` mock data in `DashboardRepository` with real DB queries
- Rewrote 4 dashboard API route files (`-metrics.ts`, `-analytics.ts`, `-recent-activity.ts`, `-overview-chart.ts`) to use `UserRepository`
- Updated `DashboardService` to call new endpoint URLs
- Updated all 5 hooks to handle new response shapes
- Replaced dashboard UI metric cards (Total Revenue → Total Users, Sales → User counts)
- Updated analytics component (clicks/visitors → user counts, referrers/devices → role/status distribution)
- Updated `RecentSales` component to show real users with role as amount
- Made `UserRow` `amount` prop optional
- All 1263 unit tests pass, lint clean, typecheck clean

**Benefits:**

- Dashboard now displays real user data from the database
- Zero `Math.random()` mock data in dashboard layer
- Consistent data mapping: overview shows user counts, analytics shows role/status distribution, charts show registrations

### Phase 17 – Dashboard UI Polish ✅

**Completed:**

- Created reusable `AnimatedNumber` component with configurable animation presets (bounce, fadeScale, slideUp, pop, gentle) and `enterDelay` alignment with parent entrance animations
- Replaced all inline `AnimatePresence`/`motion.span` patterns with `<AnimatedNumber>`, removing `calligraph` and `torph` dependencies
- Fixed bounce animation only playing for first card by making `bounce` the default preset and adding `enterDelay` to align number transitions with staggered card entrance animations
- Consolidated all metric cards on Overview tab: Total Users, Active Users, Inactive Users, Suspended Users, Active Now (removed duplicate cards from Analytics tab)
- Removed "Total Revenue" and "Sales" cards from Overview (replaced with user-status cards)
- Color-coded metric cards: Total Users → purple, Active Users → cyan, Inactive Users → amber, Suspended Users → red, Active Now → emerald
- Added `currencyConfig` to `src/config/index.ts` for configurable currency symbol/locale via env vars
- All 1300 unit tests pass, lint clean, typecheck clean

**Benefits:**

- Consistent animated number transitions across all dashboard views
- No duplicate card types between Overview and Analytics tabs
- Configurable currency display for different locales
- Cleaner dependency tree (removed 2 unused animation libraries)

### Phase 18 – Dashboard Stability & HMR Fixes ✅

**Completed:**

- **HMR-safe database init**: Used `globalThis` flags to prevent re-execution of `initializeDatabase()` on Vite HMR module re-evaluation. Persisted `db`, `sqliteClient`, `pgPoolPrimary`, `pgPoolsReplicas` on `globalThis` and restored them on re-import.
- **HMR-safe cache init**: Guarded `src/lib/cache/index.ts` storage initialization behind a `globalThis` reference; `closeStorage()` clears the global key.
- **Client-safe dashboard hooks**: Rewrote 5 hooks (`use-dashboard-metrics`, `use-dashboard-analytics`, `use-dashboard-chart`, `use-recent-users`, `use-analytics-chart`) to use `fetch()` calls instead of directly importing server-side `dashboardService` (which required node-only `db`).
- **Server-only import isolation**: Made `pg` and `drizzle-orm/node-postgres` imports dynamic (inside `createPostgresConnection()`) to prevent Vite from bundling them client-side. Changed `import { Pool } from "pg"` to `import type { Pool } from "pg"` for type-only usage.
- **Lazy getter pattern**: Added `private getDb()` to all 4 repositories to read `defaultDb` at method-call time instead of module init time, preventing client-side crashes.
- **Unhandled error responses**: Wrapped `-app.ts` `handle()` in try-catch to return proper JSON error responses instead of Elysia's default `{"status":500,"unhandled":true,"message":"HTTPError"}`. Made `errorFn` in middlewares more robust with inner try-catch fallback.
- **Role-based dashboard flash fix**: Fixed auth sync race in `src/lib/auth/sync.ts` by moving `authActions.setSession(mappedSession)` inside the `/api/users/me` fetch callback, so the auth store is never written with a stale user object (lacking `role` array). Added `syncedSessionId` ref to deduplicate React StrictMode invocations.
- **Full-page skeleton**: Replaced spinner in `RoleBasedDashboard` with a layout-accurate full-page skeleton (skeleton tabs, 5 metric cards, chart + recent users).
- All 1341 unit tests pass, lint clean, formatter clean.

**Benefits:**

- Dashboard no longer crashes on HMR file-save during development
- Client-side code never imports server-only Node modules
- Auth store is never written with a partial session (no role flash)
- All errors return proper JSON error responses
- Faster UX with skeleton instead of spinner

### Phase 20 – Dynamic RBAC Roles & Permissions ✅

**Goal:** Connect the existing RBAC tables (`role`, `permission`, `role_permission`) to actual users, make permissions dynamic (DB-driven), create centralized authorization middleware, and build admin-facing role management UI.

**Completed:**

#### Phase 20.1 – Connect RBAC Tables to Users (Foundation) ✅

- Added `user_roles` junction table linking `user` ↔ `role` (no `role_id` FK on `user` — avoids circular import)
- Created migration (drizzle/0003_soft_wild_child.sql)
- Extended `RolesRepository` with 5 new methods: `assignRoleToUser`, `removeRoleFromUser`, `getUserRoles`, `getRoleIdsForUser`, `findDefaultRole`
- Extended `UserRepository` with 4 convenience methods: `assignRole`, `removeUserRole`, `getUserRoles`, `getUserPermissions`
- Exported new types (`UserRole`, `NewUserRole`, `userRolesRelations`) from schema index

#### Phase 20.2 – Dynamic Permission Resolver ✅

- Created `PermissionResolver` service in `src/services/roles/permission-resolver.service.ts`
- Resolves permissions from DB (role-based) with in-memory TTL cache
- Supports `getUserPermissions(userId)`, `hasPermission(userId, permission)`, `hasRole(userId, role)`
- `invalidateUser(userId)` / `invalidateAll()` for cache invalidation

#### Phase 20.3 – Centralized Authorization Middleware ✅

- Created Elysia plugin in `src/middlewares/authorization.ts`
- Methods: `requireAuth()`, `requireRole()`, `requirePermission()`, `requireMinRole()`, `validateAdminAccess()`
- Refactored roles routes to use middleware via controller delegation

#### Phase 20.4 – Roles Controller Layer ✅

- Created `src/controllers/roles/controller.ts` with 10 handler functions
- Created `src/controllers/roles/index.ts` barrel export
- Refactored `src/routes/api/roles/-core.ts` to delegate all endpoints to controller

#### Phase 20.5 – Role/Permission Management Dashboard UI ✅

- Refactored `/dashboard/roles` page using modern store/provider/table/dialog pattern
- Created `src/lib/stores/dashboard/roles.ts` — TanStack Store for roles and permissions data
- Created `src/features/roles/data/schema.ts` — Zod schemas for Role and Permission types
- Created `src/features/roles/components/` with full component suite:
  - `roles-provider.tsx` / `permissions-provider.tsx` — context providers
  - `roles-table.tsx` / `permissions-table.tsx` — data tables with pagination/filtering
  - `roles-columns.tsx` / `permissions-columns.tsx` — column definitions
  - `roles-row-actions.tsx` / `permissions-row-actions.tsx` — dropdown menus
  - `roles-action-dialog.tsx` / `permissions-action-dialog.tsx` — create/edit dialogs
  - `roles-delete-dialog.tsx` / `permissions-delete-dialog.tsx` — delete confirmation dialogs
  - `roles-primary-buttons.tsx` / `permissions-primary-buttons.tsx` — action buttons
  - `roles-dialogs.tsx` / `permissions-dialogs.tsx` — dialog orchestrators
  - `roles-overview-cards.tsx` — dashboard cards showing role/permission counts
- Sidebar navigation entry for "Roles & Permissions" already existed

#### Phase 20.6 – Role Assignment on User Creation/Management ✅

- Updated `POST /api/users` to accept optional `roleId` and call `userRepository.assignRole`
- Updated `PATCH /api/users/:id` to accept optional `roleId` and re-assign RBAC roles
- Dashboard metrics endpoint now returns `totalRoles` and `totalPermissions`

#### Phase 20.7 – Testing ✅

- Repository unit tests: `test/unit/repositories/roles/roles.repository.test.ts` (12 tests)
- Service unit tests: `test/unit/services/roles/roles.service.test.ts` (14 tests)
- Permission resolver unit tests: `test/unit/services/roles/permission-resolver.service.test.ts` (13 tests)
- Contract tests: `test/unit/contract/api/roles/roles.test.ts` (9 tests)
- E2E tests: `.e2e/api/roles.spec.ts` (unauthorized, forbidden, admin access, dashboard metrics)

#### Phase 20.8 – DB Permission Fetching, Dashboard Animations & Sidebar Refinements ✅

- **DB-powered sidebar filtering**: New `GET /api/roles/permissions/mine` endpoint returns current user's effective permissions resolved from DB via `PermissionResolver`. New `useMyPermissions()` client hook fetches from endpoint, caches in `sessionStorage` (5 min TTL), falls back to hardcoded permissions on failure.
- **NavGroup uses DB permissions**: Replaced static `usePermission().can()` with `useMyPermissions().can()` in `src/components/layout/nav-group.tsx`. Static `roles` array still used as fallback for items without `permission` field.
- **Tasks visibility restricted**: Changed `permission: "tasks:read"` to `roles: ["user", "manager", "cashier"]` so Tasks only shows for those roles (excludes admin/superadmin).
- **Roles dashboard animated**: Added staggered fadeIn+slideUp (`motion.div`) and bounce animated numbers (`AnimatedNumber`) to overview cards and tab content — matching dashboard overview animation pattern.
- Full suite: **1473 pass, 0 fail**, lint clean, typecheck clean, React Doctor 100/100.

---

### Phase 24 – RBAC Overhaul: Roles, Settings, Profile, Users Controllers 💪 (Active)

**Goal:** Refactor remaining routes to follow the layered architecture pattern (HTTP → Controller → Service → Repository), aligning them with Phase 20's RBAC infrastructure. Migrate route logic out of `-core.ts` files into proper controllers and services.

**Completed:**

#### Phase 24.1 – Settings Profile & Account Controllers ✅

- Extracted settings routes from monolithic inline handlers into proper controller/service layers:
  - Created `src/controllers/settings/controller.ts` with `getProfile`, `updateProfile`, `getAccount`, `updateAccount` handlers
  - Created `src/services/dashboard/settings/profile.ts` with business logic for profile CRUD
  - Created `src/services/dashboard/settings/account.ts` with account management logic
- Refactored `src/routes/api/settings/-profile.ts` to delegate all endpoints to controller
- Maintained backward compatibility with existing `DbType` dependency injection pattern

#### Phase 24.2 – Roles Controller Layer ✅

- Created `src/controllers/roles/controller.ts` with typed handler functions:
  - `getRoles`, `createRole`, `updateRole`, `deleteRole`
  - `getPermissions`, `createPermission`, `updatePermission`, `deletePermission`
  - `getRolePermissions`, `updateRolePermissions`
- Refactored `src/routes/api/roles/-core.ts` to delegate to controller
- Aligned with auth middleware pattern from Phase 20 (`requireRole`, `requirePermission`)

#### Phase 24.3 – Users Controller Layer ✅

- Created `src/controllers/users/controller.ts` with typed handler functions:
  - `getUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`
  - `getCurrentUser`, `getUserRoles`, `updateUserRoles`
- Refactored `src/routes/api/users/-core.ts` to delegate to controller
- Added proper error handling for user CRUD operations

#### Phase 24.4 – MCP API Keys Controller Layer ✅

- Created `src/controllers/mcp/keys.controller.ts` with typed handler functions:
  - `getApiKeys`, `createApiKey`, `updateApiKey`, `deleteApiKey`
- Refactored `src/routes/api/mcp/-keys.ts` to delegate to controller
- Aligned with existing `ApiKeysService` and `ApiKeysRepository`

#### Phase 24.5 – Settings Display & Notifications Controllers ✅

- Created `src/controllers/settings/display/controller.ts` with display settings handlers
- Created `src/controllers/settings/notifications/controller.ts` with notification preferences handlers
- Refactored settings display/notifications routes to delegate to controllers

#### Phase 24.6 – Test Setup Fix (In-Memory DB Migrations) ✅

- Fixed `test/setup.ts` which was silently failing to create database tables during test preload:
  - **Root cause**: `runMigrations()` used `db.execute()` which doesn't exist on Drizzle LibSQL ORM instances. The Drizzle ORM exposes `db.run()` for raw SQL, not `db.execute()`. The error was silently caught by a catch block, causing all 6 dashboard contract tests to fail with "Failed query: select count(\*) from 'user'" because no tables existed in the in-memory database.
  - **Fix**: Changed `runMigrations` to use `sqliteClient.execute()` (the raw LibSQL client) instead of the Drizzle ORM `db` instance. Added the `sqliteClient` named export to the dynamic import in `setup()`.
  - **Impact**: All 1474 unit tests now pass (was 1468 before, 6 previously failing).
- Added proper `TEST_AUTH_BYPASS` environment variable support for dashboard contract tests, allowing tests to authenticate without a real Better Auth session.

**Files Changed:**

- `test/setup.ts` — Fixed `db.execute` → `sqliteClient.execute` for migration DDL
- Created `src/controllers/settings/controller.ts`
- Created `src/services/dashboard/settings/profile.ts`
- Created `src/services/dashboard/settings/account.ts`
- Created `src/controllers/roles/controller.ts`
- Created `src/controllers/users/controller.ts`
- Created `src/controllers/settings/display/controller.ts`
- Created `src/controllers/settings/notifications/controller.ts`
- Created `src/controllers/mcp/keys.controller.ts`
- Refactored `src/routes/api/settings/-profile.ts`
- Refactored `src/routes/api/roles/-core.ts`
- Refactored `src/routes/api/users/-core.ts`
- Refactored `src/routes/api/mcp/-keys.ts`
- Refactored settings display/notifications routes

**Tests:** 1474 pass, 0 fail. Lint clean. Typecheck clean.

### Phase 19 – Production Seed & Environment-Aware Seeding ✅

**Completed:**

- **Production-mode seeding**: Added `--prod` CLI flag and `NODE_ENV=production` detection to seed script. Production mode seeds only 2 essential accounts (superadmin + admin). No fake users.
- **Dev-mode seeding**: Seeds 5 static users (superadmin, admin, manager, cashier, user) plus 100 fake users with graph-friendly timestamps.
- **Graph seed data**: 80% of fake users (80 users) spread across all 12 months of the current year for the monthly bar chart. 20% (20 users) spread across the last 7 days for the weekly registrations chart.
- **Deterministic output**: Uses `faker.seed()` for reproducible fake user generation.
- **CLI flags**: `--fresh` (reset DB before seeding), `--count=N` (override fake user count), `--seed=N` (override faker seed), `--prod` (production mode).
- Renamed `ADMIN_CREDENTIALS` → `ESSENTIAL_USERS` (superadmin + admin) and `DEV_USERS` (manager, cashier, user).
- All 1341 unit tests pass, lint clean, formatter clean.

**Benefits:**

- Production deployment seeds only admin accounts (no fake data)
- Dev environment has meaningful chart data out of the box
- Deterministic seeds for reproducible testing
- `--fresh` flag enables clean reseeding

### Phase 20 – Dashboard Code Review Fixes ✅

**Completed:**

- **Side-effect compliance**: Moved `onLoadCountChange` callback from render body to `useEffect` in `recent-users.tsx` to comply with React rules.
- **Cyclomatic complexity**: Extracted `shouldLoadMore()` (offset+cap guard) and `fetchUserPage()` into exported helpers from `use-recent-users.ts`, reducing `loadMore` CRAP score from 49.5 to ~12.
- **DRY monthly queries**: Extracted `buildMonthlyData()` private helper shared by `getMonthlyRegistrations` and `getMonthlyRegistrationsForYear` in `users.ts`.
- **Shared constant**: Moved duplicated `monthNames` arrays into `MONTH_NAMES` at `src/config/date.ts`, consumed by 4 locations (repositories, route, hook).
- **Query order**: Fixed `findRecent` to chain `.where()` before `.offset()`, matching `findAll` pattern.
- **Dead code**: Removed unused `_i` variable in `Array.from` skeleton loop.
- **Edge-case hardening**: Added `max !== undefined && max <= 0` guard in initial `useEffect` to prevent fetching when cap is zero. Changed `if (max && ...)` to `if (max !== undefined && ...)` in `loadMore` to handle `max=0` correctly.
- **Stable scroll handler**: Used `loadMoreRef` pattern in `recent-users.tsx` so `handleScroll` callback does not recreate on every batch load.
- **Branding fix**: Changed `<div>` to `<span>` wrapping `ScrambledText` to prevent block-element line break in `BrandTitle`.
- **Font size**: Reduced global Tailwind font-size scale for dashboard-optimized reading (`text-base` → 0.875rem, `text-sm` → 0.8125rem, etc.) via `src/styles/theme.css`.
- **Tests added**:
  - 11 unit tests for `shouldLoadMore` + `fetchUserPage` (use-recent-users.test.ts)
  - 4 unit tests for `findRecent` offset/role (users.repository.test.ts)
  - 4 unit tests for `MONTH_NAMES` constant (config/date.test.ts)
  - 3 E2E tests for recent-activity `/users` endpoint with offset pagination (dashboard/index.spec.ts)
- All 1370+ unit tests pass, lint clean, typecheck clean.

### Phase 6 – Main Dashboard Implementation ✅

**Completed:**

- Created API endpoints for dashboard data (metrics, analytics, recent activity, overview chart)
- Created dashboard service that fetches data from API endpoints
- Created custom hooks for dashboard data fetching
- Updated dashboard components to use data-fetching hooks
- Integrated real-time updates using existing dashboard service
- Tested dashboard functionality with real data
- Verified loading and error states work correctly

**Benefits:**

- Dashboard now displays real-time data from the backend
- Improved user experience with loading and error states
- Follows the layered architecture pattern (HTTP → Controller → Service → Repository)

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
- Unit tests: `test/unit/lib/docker/index.test.ts`

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
- [Phase 15: Replace Fake Dashboard Analytics with Real User Data](./plans/phase-15-dashboard-real-user-data.md)
- [Phase 21: Nightly Dev Build Workflow](./.github/workflows/nightly.yml)

---

## Success Criteria

- Clear priorities at all times
- No duplication with execution plans
- Easy onboarding for new contributors
- System scales to enterprise workloads