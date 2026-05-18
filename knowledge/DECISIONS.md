---
title: DECISIONS.md
description: Track important architectural and technical decisions.
---

## Purpose

Track important architectural and technical decisions.

Each decision must answer:

- Why this approach?
- What alternatives were considered?
- What are the tradeoffs?

---

## Decision Log

---

### 001: Use Bun as Runtime

**Status:** Accepted

**Why:**

- Faster install + execution
- Native TS support
- Simplified tooling

**Tradeoffs:**

- Smaller ecosystem vs Node.js
- Potential compatibility issues

---

### 002: Multi-Database Strategy

**Status:** Accepted

**Approach:**

- SQLite → Development
- PostgreSQL → Production
- Cache (Redis/Postgres/LRU) → Cache + Pub/Sub

**Why:**

- Environment flexibility
- Performance optimization

**Tradeoffs:**

- Increased complexity
- Operational overhead

---

### 003: Use Unstorage for Storage Layer

**Status:** Accepted

**Why:**

- Unified abstraction
- Multi-backend support

**Tradeoffs:**

- Abstraction overhead
- Debugging complexity

---

### 004: MCP as External API Layer

**Status:** Accepted

**Why:**

- Standardized AI integration
- Tool-based extensibility

**Tradeoffs:**

- Additional infra complexity
- Security considerations

---

### 005: WebSockets for Real-time

**Status:** Accepted

**Why:**

- Low latency updates
- Presence + notifications

**Tradeoffs:**

- Stateful connections
- Scaling complexity

---

### 006: Cache as Core Infra Component

**Status:** Accepted

**Used for:**

- Cache (multi-backend: Redis, PostgreSQL, LRU)
- Pub/Sub (Redis only)
- Rate limiting
- Sessions

**Why:**

- Unified storage abstraction via Unstorage
- Multiple backends for flexibility (Redis/Postgres/LRU)
- Fallback to LRU for local development

**Tradeoffs:**

- External dependency (when using Redis)
- Operational cost (Redis)

---

### 007: GitHub Actions Workflows for Decision Enforcement

**Status:** Accepted

**Why:**

- Enforce DECISIONS.md updates when architecture changes
- Automate GitHub Issues from TASKS.md task tracking
- Improve developer experience with workflow automation

**Components:**

- `decisions-check.yml`: Fails PR if architecture files change but DECISIONS.md not updated
- `sync-tasks.yml`: Creates GitHub Issues from tasks without issue numbers
- `new-decision.ts`: CLI to create new decision entries
- `sync-tasks.ts`: Script to extract tasks needing issues

**Tradeoffs:**

- Additional workflow maintenance
- Complexity in workflow configuration

---

### 008: OpenCode DevKit Submodule

**Status:** Accepted

**Why:**

- Provides local OpenCode tooling for development
- Ensures consistent AI tooling version across contributors
- Allows customization of OpenCode behavior via `.opencode` directory

**Components:**

- `.gitmodules`: Defines submodule path and remote repository
- `.opencode/`: Local devkit configuration and customizations

**Tradeoffs:**

- Submodule adds clone overhead
- Requires `git submodule update --init` for new contributors

---

### 009: Client-Side Auth State with TanStack Store

**Status:** Accepted

**Why:**

- Client-side auth state management using TanStack Store (not React context)
- Cookie-based persistence for SSR hydration safety
- Synchronized with Better Auth session

**Implementation:**

- `authStore`: TanStack Store for reactive auth state
- `useAuthStore()`: Hook to access auth state
- `useAuthInit()`: Initialize auth from cookies on client
- `useAuthInitialized()`: Guard to prevent hydration mismatches

**Changes (this PR):**

- Fixed: Use React.useEffect instead of non-existent `@tanstack/react-store/createEffect`
- Fixed: `setState(() => {...})` callback pattern for TanStack Store API
- Added: `useAuthInitialized()` guard to prevent redirect before ready
- Export: `authStore` for direct test access

**Tradeoffs:**

- Cookie reading deferred to client-side createEffect (avoids SSR mismatch)
- Tests use `authStore.get()` instead of hook (hooks need React context)

---

### 012: User Settings Backend API with Separate Tables

**Status:** Accepted

**Why:**

- Scalable settings storage with dedicated tables per settings domain
- Clear separation of concerns (Profile, Account, Display, Notifications)
- SQLite-compatible JSON storage for flexible data (urls, sidebar items)
- API-driven CRUD operations with authentication via Better Auth session

**Implementation:**

- 4 new database tables:
  - `user_settings_profile`: username, bio, urls (JSON)
  - `user_settings_account`: name, dob, language
  - `user_settings_display`: sidebar items (JSON)
  - `user_settings_notifications`: email/mobile preferences
- 4 new API route files under `/api/settings/`:
  - `profile.ts` - GET/PUT `/api/settings/profile`
  - `account.ts` - GET/PUT `/api/settings/account`
  - `display.ts` - GET/PUT `/api/settings/display`
  - `notifications.ts` - GET/PUT `/api/settings/notifications`
- Updated `settingsStore` with real API calls replacing mock data
- Unit tests for unauthenticated access and request validation

**Tradeoffs:**

- New tables require migration before authenticated operations work
- JSON storage in SQLite has query limitations vs PostgreSQL JSONB
- API pattern requires session authentication check on each endpoint

---

### 010: Enhanced Profile Settings Form

**Status:** Accepted

**Why:**

- Improve user experience for editing profile information
- Add proper form validation with Zod
- Implement client-side state management with TanStack Store
- Provide better feedback during form submission

**Implementation:**

- Created comprehensive Zod schema for profile validation (username, email, bio, URLs)
- Used tanstack-form with Zod validation for form handling
- Integrated with TanStack Store profile state for data persistence
- Added loading states and error handling for form submission
- Implemented dynamic URL field management with manual array handling

**Tradeoffs:**

- More complex form logic compared to simple controlled components
- Requires careful synchronization between form state and profile store

---

### 011: Unified Settings Store (TanStack Store)

**Status:** Accepted

**Why:**

- Centralize all user settings (Profile, Account, Display, Notifications) in one store
- Simplify state management across settings components
- Provide reactive state updates with TanStack Store
- Reduce boilerplate code compared to multiple separate stores

**Implementation:**

- `settingsStore`: Single TanStack Store containing all settings state
- `useSettingsStore()`: Hook to access settings state
- `settingsActions`: Actions for CRUD operations on each settings type
- Default values for display and notification settings
- Initialize from session user data

**Components Updated:**

- Profile, Account, Display, Notifications forms now use unified store
- Added JSDoc comments to all components
- Added unit tests for settings store

**Tradeoffs:**

- Single store may become larger over time
- Need to ensure proper TypeScript typing for partial updates

---

### 013: Service Layer Architecture (Business Logic Separation)

- The original sync-tasks.yml created GitHub Issues from TASKS.md placeholders but never updated TASKS.md with the created issue numbers
- This caused duplicate issues to be created on every push to main since the same `<!-- issue: # -->` placeholder remained

**Changes:**

- Added duplicate check using `gh issue list --search "$TITLE"` before creating new issues
- Extract issue number from created issue URL and update TASKS.md with `sed -i`
- Commit and push updated TASKS.md back to repository
- Simplified git config (removed unused secrets fallback)

**Implementation:**

- Check if issue with same title exists: `gh issue list --search "$TITLE" --state all`
- Extract issue number: `echo "$ISSUE_URL" | grep -oE '[0-9]+$'`
- Update TASKS.md: `sed -i "s|<!-- issue: # -->|<!-- issue: #$ISSUE_NUM -->|"`
- Commit changes if TASKS.md was modified

**Tradeoffs:**

- Search-based duplicate check may have false positives for similar titles (uses GitHub issue search which matches partial titles)
- Workflow now requires push permissions to commit changes
- Consider migrating to exact title matching via `gh issue list --search "repo:OWNER/REPO \"Exact Title\""` for stricter matching

---

### 014: Fix sync-tasks Workflow to Prevent Duplicate Issue Creation

**Status:** Accepted

**Why:**

- Separate business logic from route handlers (thin routes)
- Enable reuse across routes and MCP tools
- Improve testability (services testable without HTTP overhead)
- Cleaner route handlers focused on HTTP concerns (parsing, validation, responses)

**Implementation:**

- Created `src/services/` directory with 4 service modules:
  - `settings/`: User settings CRUD (profile, account, display, notifications)
  - `llmo/`: Schema.org data transformation for AI systems
  - `mcp/`: Health rate limiting and tool catalog
  - `status/`: Historical health record fetching
- Route handlers in `src/routes/api/` now delegate to services
- Services handle database operations, session management, data transformation
- Routes only handle HTTP: parsing params, returning responses

**Directory Structure:**

```
src/services/
├── settings/
│   ├── profile.ts       # Profile CRUD
│   ├── account.ts       # Account CRUD
│   ├── display.ts       # Display preferences CRUD
│   ├── notifications.ts  # Notification settings CRUD
│   └── index.ts
├── llmo/
│   ├── blog.ts          # Blog data + schema.org transform
│   ├── docs.ts          # Docs static data
│   ├── changelog.ts     # Changelog data + schema.org transform
│   ├── faq.ts          # FAQ data + filtering
│   ├── transform.ts     # Server info & capabilities
│   ├── llms.ts          # LLMS.txt content generation
│   └── index.ts
├── mcp/
│   ├── rate-limiter.ts  # Health endpoint rate limiting
│   ├── tools.ts         # MCP tool catalog
│   └── index.ts
└── status/
    ├── history.ts      # Historical status fetching
    └── index.ts
```

**Tradeoffs:**

- Additional indirection layer
- Need to maintain service interfaces when APIs change
- Services may need to be instantiated per-request for some frameworks

---

### 015: Decision: API Layered Architecture

#### Context

The `src/routes/api/` directory contained a mix of HTTP handling, business logic, and ORM operations. This monolithic structure made the codebase harder to maintain, test, and scale. Specifically:

1. **MCP API keys** (`src/routes/api/mcp/-keys.ts`) contained both ORM queries and business logic
2. **Settings API** (`src/routes/api/settings/*`) mixed session validation with database operations
3. **Services** (`src/services/dashboard/settings/*`) contained inline ORM logic instead of delegating to repositories
4. **No clear separation** between HTTP concerns, business rules, and data access

#### Decision

Implement a **layered architecture** with clear separation of concerns:

```
HTTP Layer (routes/) → Controller Layer (controllers/) → Service Layer (services/) → Repository Layer (repositories/)
```

#### Layer Responsibilities

| Layer          | Directory           | Responsibility                                           |
| -------------- | ------------------- | -------------------------------------------------------- |
| **HTTP**       | `src/routes/api/`   | Route definitions, HTTP handling, OpenAPI docs           |
| **Controller** | `src/controllers/`  | Session validation, request parsing, response formatting |
| **Service**    | `src/services/`     | Business logic, data transformation, validation rules    |
| **Repository** | `src/repositories/` | ORM operations, database queries, data access            |

#### Rationale

###### 1. **Separation of Concerns**

- Each layer has a single, well-defined responsibility
- Changes in business logic don't affect HTTP handling
- Database schema changes don't impact business rules

###### 2. **Testability**

- Repositories can be mocked for service tests
- Services can be tested in isolation
- Controllers can be unit tested with mock services

###### 3. **Maintainability**

- Clear file locations for different types of logic
- Easier onboarding for new developers
- Consistent patterns across all API modules

###### 4. **Scalability**

- New API modules follow the same pattern
- Layers can be extended independently
- Supports future requirements (caching, logging, etc.)

###### 5. **Interface-Based Design**

- Repositories use interfaces for abstraction
- Services depend on abstractions, not concretions
- Enables dependency injection for testing

#### Alternatives Considered

###### Alternative 1: Keep Monolithic Route Handlers

- ❌ Mixes concerns in single files
- ❌ Harder to test in isolation
- ❌ Business logic tied to HTTP framework

###### Alternative 2: Service-Only Pattern (no repositories)

- ❌ Services still contain ORM logic
- ❌ Database concerns mixed with business rules
- ❌ Harder to switch ORMs or databases

###### Alternative 3: CQRS Pattern

- ❌ Overkill for current project size
- ❌ Increased complexity
- ❌ Steeper learning curve

#### Consequences

##### Positive

- ✅ Clear separation of concerns
- ✅ Improved testability
- ✅ Better maintainability
- ✅ Consistent patterns
- ✅ Type-safe interfaces
- ✅ Backward compatible (re-exports in `src/lib/mcp/api-keys.ts`)

##### Negative

- ⚠️ More files to manage (mitigated by barrel exports)
- ⚠️ Slightly more complex for simple endpoints
- ⚠️ Learning curve for developers unfamiliar with pattern

#### Implementation Details

##### Repository Layer

```typescript
// Interface for abstraction
export interface IMcpApiKeyRepository {
  findValidKeyByHash(keyHash: string): Promise<McpApiKey | null>;
  insertKey(data: ...): Promise<McpApiKey>;
  // ...
}

// Implementation with Drizzle ORM
export class McpApiKeyRepository implements IMcpApiKeyRepository {
  async findValidKeyByHash(keyHash: string) {
    return db.query.mcpApiKeys.findFirst({ where: ... });
  }
  // ...
}
```

##### Service Layer

```typescript
export class McpApiKeyService {
  constructor(private repository: IMcpApiKeyRepository) {}

  async validateApiKey(plainKey: string) {
    const keyHash = this.hashKey(plainKey);
    const result = await this.repository.findValidKeyByHash(keyHash);
    // Business logic here
  }
}
```

##### Controller Layer

```typescript
export async function validateSession(request, set) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    set.status = 401;
    return { error: new Response(...) };
  }
  return { session: { userId: session.user.id } };
}
```

##### HTTP Layer

```typescript
export const mcpKeysRoutes = new Elysia({ prefix: "/keys" }).get("/", async ({ apiKey }) => {
  const { error, userId } = await validateSession(request, set);
  if (error) return error;
  return mcpApiKeyService.listApiKeys(userId);
});
```

---

### 016: Better Result Integration for Type-Safe Error Handling

**Status:** In Progress

**Why:**

- Replace try/catch with explicit Result types (Ok/Err)
- Type-safe error handling across all layers
- Eliminate unhandled exceptions
- Align with layered architecture (Repository → Service → Controller → HTTP)

**Implementation:**

- Added `better-result` dependency
- Created `src/lib/result.ts` with tagged errors (DatabaseError, NotFoundError, ValidationError, etc.)
- Added `appErrorToResult()` for backward compatibility with existing AppError
- Refactored repositories to return `Result<T, TaggedError>` using `Result.tryPromise()`
- Updated services and controllers to handle Result types
- Added unit tests for result.ts (42 tests) and errors.ts (24 tests)

**Phased Migration:**

1. Phase 1: Add dep, create result.ts ✅
2. Phase 2: Refactor repositories to return Results (in progress)
3. Phase 3: Update controllers to handle Result types
4. Phase 4: Update middlewares, config, plugins
5. Phase 5: Deprecate old AppError and clean up

**Tradeoffs:**

- Learning curve for developers unfamiliar with Result pattern
- More verbose function signatures (explicit error types)
- Requires refactoring across multiple layers
- Benefits: explicit error types, consistent handling, easier testing

---

### 017: GitHub Actions Workflow Restructuring

**Status:** Accepted

**Why:**

- Optimize CI/CD pipeline by moving resource-intensive coverage to release only
- Simplify workflow triggers to reduce unnecessary runs
- Improve developer experience with more flexible task sync options

**Changes:**

1. **CI Workflow (`ci.yml`)**:
   - Removed `branches: [main]` filter from pull_request (allows PRs from forks)
   - Removed Codecov upload (coverage not required for every CI run)
   - Simplified test execution

2. **Fallow Workflow (`fallow.yml`)**:
   - Removed push trigger to main (only runs on PRs now)
   - Changed pull_request types to `[opened, synchronize, reopened]`

3. **Release Workflow (`release.yml`)**:
   - Added coverage reporting with Codecov upload
   - Runs full test coverage only on release (not on every CI run)

4. **Sync Tasks Workflow (`sync-tasks.yml`)**:
   - Changed trigger from push to pull_request with paths filter
   - Added `workflow_dispatch` for manual trigger
   - Runs when TASKS.md changes in PRs

**Tradeoffs:**

- Coverage not visible on every PR (only on release)
- Fork PRs now trigger CI (may increase resource usage)
- Sync tasks requires PR to see changes

---

### 018: Reusable GitHub Actions Components

**Status:** Accepted

**Why:**

- Follow DRY principle (Don't Repeat Yourself) across workflows
- Single point of change for common patterns
- Consistent behavior across all workflows
- Easier maintenance and testing
- Enable versioned updates to common logic

**Implementation:**

Created 11 reusable actions under `.github/actions/`:

| Action                | Purpose                                  |
| --------------------- | ---------------------------------------- |
| `setup-environment`   | Checkout + Setup Bun + Cache + Install   |
| `configure-git`       | Configure Git user and remote URL        |
| `disable-submodules`  | Disable submodule recursion              |
| `run-quality-checks`  | Run lint:ci + typecheck                  |
| `run-tests`           | Run tests with optional coverage         |
| `run-security-audit`  | Run bun audit                            |
| `setup-database`      | Setup/reset/remove database              |
| `docker-build-scan`   | Build Docker + Trivy scan + Post results |
| `run-opencode`        | Run OpenCode AI for review/triage        |
| `commit-changes`      | Commit and push changes                  |
| `check-changed-files` | Detect changed files in PR               |

**Workflows Refactored:**

1. **ci.yml**: Reduced from 191 lines to ~75 lines using reusable actions
2. **release.yml**: Uses configure-git, commit-changes, changelogen + changelogithub
3. **sync-tasks.yml**: Uses commit-changes for updating TASKS.md
4. **autofix.yml**: Uses setup-environment + commit-changes
5. **pr-review.yml**: Uses run-opencode + disable-submodules
6. **issue-triage.yml**: Uses run-opencode + disable-submodules

**Example Usage:**

```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-environment

      - uses: ./.github/actions/run-quality-checks
```

**Tradeoffs:**

- Additional indirection layer (harder to trace in GitHub UI)
- Must maintain action versions separately
- Initial development time investment
- Benefits: ~40% reduction in workflow code duplication

---

### 019: Repository Dependency Injection for Testability

- Enable inline mocking in unit tests without database connections
- Support dependency injection pattern for better testability
- Allow repositories to work with any compatible database instance
- Align with layered architecture (Repository → Database abstraction)

**Implementation:**

- Added optional `db` parameter to repository constructors:

  ```typescript
  constructor(db?: DbType) {
    this.db = db ?? defaultDb;  // Use injected db or fallback to default
  }
  ```

- Changed all internal DB calls from `db.method()` to `this.db.method()`

- Updated test files to inject mock databases:
  ```typescript
  const mockDb = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) ),
    insert: () => ({ values: () => Promise.resolve([]) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
  };
  const repository = new AccountRepository(mockDb);
  ```

**Files Changed:**

- `src/repositories/settings/account.repository.ts`
- `src/repositories/settings/display.repository.ts`
- `src/repositories/settings/notifications.repository.ts`
- `test/repositories/settings/account.repository.test.ts`
- `test/repositories/settings/display.repository.test.ts`
- `test/repositories/settings/notifications.repository.test.ts`

**Benefits:**

- ✅ Tests run without database setup
- ✅ Fast unit tests (no I/O)
- ✅ Explicit mocking (no hidden dependencies)
- ✅ Type-safe database injection via `DbType`

**Tradeoffs:**

- ⚠️ Slightly more verbose constructor
- ⚠️ Need to maintain mock structure in tests
- ⚠️ Learning curve for developers unfamiliar with pattern

---

### 020: Semantic Versioning with PR Pre-release Support

**Status:** Accepted

**Why:**

- Support concurrent PRs without version collision
- Provide version preview during PR review (no release creation)
- Enable hotfix branch workflow with proper versioning
- Allow manual version bumps for minor/major releases

**Implementation:**

Created `versioning.yml` workflow with three modes:

1. **PR Pre-release** (`pull_request` trigger):
   - Calculates version: `X.Y.Z-rc.<PR#>` or `X.Y.Z-hotfix.<N>` for hotfix branches
   - Updates `package.json` for display purposes
   - **No release created** (only version calculation)
   - Uses PR number for deterministic suffix (no collision)

2. **Main Merge** (`push` to `main`):
   - release.yml runs independently on push to main (not triggered by versioning.yml)
   - Auto-detects bump type from commits:
     - `BREAKING CHANGE:` → major bump
     - `feat:` → minor bump
     - Otherwise → patch bump
   - Creates annotated tag + GitHub release
   - versioning.yml provides informational version calculation only

3. **Manual Bump** (`workflow_dispatch`):
   - Accepts `version_bump` input (patch/minor/major)
   - Overrides auto-detection

**Version Derivation:**

```bash
# Get base version (excludes pre-releases)
git describe --tags --abbrev=0 | grep -vE 'rc|hotfix'
# → v1.2.3
```

**Tradeoffs:**

- Additional workflow to maintain
- PR pre-releases don't create releases (by design - correct behavior)
- Excludes pre-release tags from base version calculation (intentional)
- Hotfix merges to main convert to patch bump (not hotfix.N)
- versioning.yml calculates version for PR preview only; release.yml owns actual release
- Both workflows use changelogen/commit analysis independently (intentional separation)
  - release.yml is the SOURCE OF TRUTH for actual releases
  - versioning.yml provides informational display during PR review
  - Different analysis methods are acceptable since versioning.yml doesn't create releases

---

### 021: CI/CD Workflow Trigger Updates and Database Environment Variables

**Status:** Accepted

**Why:**

- Use `pull_request` triggers for better PR-based validation
- Add database environment variables (`DATABASE_TYPE`, `SQLITE_URL`) to CI workflow for proper database configuration during tests
- Tag-based release workflow for semantic versioning
- Prevent duplicate CI runs (PR merge triggers via push to main, not direct push)

**Changes:**

1. **CI Workflow (`ci.yml`)**:
   - Uses `pull_request` trigger (not push to main)
   - Added `env` section with `DATABASE_TYPE: "sqlite"` and `SQLITE_URL: "file:.artifacts/tsse-elysia.db"`
   - Added `create-release` job that runs on main push to trigger version bump and release

2. **Release Workflow (`release.yml`)**:
   - Uses tag-based trigger (`push: tags: ["v*"]`)
   - Added workflow_dispatch for manual version bump (patch/minor/major)
   - Uses changelogen for version bumping and changelog generation
   - No database env vars (not needed for release)

**Rationale:**

- PR-based CI triggers validate changes before merge
- Tag-based release workflow for semantic versioning
- Database env vars ensure CI tests run with proper configuration
- Changelogen handles version bump and changelog automatically

**Tradeoffs:**

- Release requires manual tag creation or workflow_dispatch trigger
- No automatic version bump on PR merge (uses conventional commits)

---

### 022: Simplified Release Workflow with changelogen and changelogithub

**Status:** Accepted

**Why:**

- Simplify release process with minimal workflows
- Use @unjs/changelogen for version management and changelog generation
- Use changelogithub for GitHub release creation
- Trigger releases only on tag push (manual or automated)
- Keep NPM publishing code commented for reference only

**Current Workflow:**

1. **release.yml** (`push tags v*` or `workflow_dispatch`):
   - Triggered on version tag push (e.g., `v1.2.3`)
   - Manual trigger via workflow_dispatch with tag input
   - Uses `bun changelogen --output` to generate changelog
   - Uses changelogithub to create GitHub release with changelog
   - NPM publishing code commented for reference

**Usage:**

```bash
# Create a version tag (manually or via script)
git tag v1.2.3
git push origin v1.2.3

# Or trigger via workflow_dispatch with tag name
```

**Tradeoffs:**

- Simpler workflow (1 instead of multiple)
- No automatic version bump on PR merge (manual process)
- Changelog generation relies on conventional commits
- NPM publishing available but not active

---

### 023: User Management with Dashboard and API

**Status:** Completed

**Why:**

- Add user management UI for admin users
- Enable user CRUD operations via API
- Support pagination and filtering for large user lists
- Provide async loading with skeleton states
- Use client-side fetching (no SSR database access)

**Implementation:**

1. **User Repository** (`src/repositories/users.ts`):
   - `findAll` - Find users with filtering (role, status, search) and pagination
   - `findById` - Find user by ID
   - `findByEmail` - Find user by email
   - `count` - Count total users

2. **Users API** (`src/routes/api/users/-core.ts`):
   - `GET /api/users` - List users with pagination and filtering
   - `GET /api/users/:id` - Get user by ID
   - Removed admin role requirement (any authenticated user can view)

3. **Dashboard Updates**:
   - Users page fetches data via store (`usersActions.fetchAll()`)
   - Async user count with skeleton in dashboard card
   - Refresh button with loading spinner

4. **Database Schema** (`src/lib/db/schema/auth.ts`):
   - Added columns: `firstName`, `lastName`, `username`, `phoneNumber`, `role`, `status`
   - Migration created: `drizzle/0001_wooden_roughhouse.sql`

5. **Tests**:
   - Unit tests: `test/repositories/users.repository.test.ts`
   - E2E tests: `.e2e/routes/_authenticate/dashboard/users.spec.ts`

**Lessons Learned:**

- TanStack Start loaders run in Node.js SSR context (no browser fetch)
- Use `BASE_URL` for server-side fetch calls: `fetch(\`${BASE_URL}/api/users\`)`
- Client components should use client-side fetching (useEffect) not loaders for authenticated routes
- Test database schemas must match production schema columns

**Tradeoffs:**

- ⚠️ Removed admin role restriction (any authenticated user can view user list)
- ⚠️ Client-side fetching adds network latency compared to SSR
- ⚠️ Skeleton state increases code complexity

---

### 024: Automated CHANGELOG and Version Bump on PR Merge

**Status:** Accepted

**Why:**

- Automate version management when PRs are merged to main
- Keep CHANGELOG.md up-to-date with each release
- Prevent duplicate tag creation errors
- Run security scans only on PRs, not on main push

**Changes:**

1. **CI Workflow (`ci.yml`)**:
   - Added `Commit Version Changes` step after changelogen to commit CHANGELOG.md and package.json
   - Added tag existence check before creating tags (prevents "tag already exists" errors)
   - Removed `Security Scan` and `Docker Security Scan` from main branch push (only run on PRs)
   - Made release trigger dynamic: uses `GITHUB_HEAD_REF` for PRs or extracts branch from `GITHUB_REF` for direct pushes
   - Removed `pull_request.merged` condition (was causing release to skip on non-PR main pushes)

2. **Release Workflow (`release.yml`)**:
   - Removed broken `workflow_dispatch` trigger (referenced non-existent bump-version job)
   - Simplified to only trigger on tag push

3. **AGENTS.md**:
   - Updated release process documentation

**Release Flow:**

```
1. PR merged to main → CI runs
2. After CI passes → create-release job:
   - Runs changelogen --bump (updates package.json + CHANGELOG.md)
   - Commits changes with "chore: release v<x.y.z>"
   - Pushes commit to branch dynamically
   - Creates and pushes version tag (e.g., v0.1.0) with --force-if-needed
3. Tag pushed → release.yml creates GitHub Release
```

**Tradeoffs:**

- Additional CI run triggered by commit push (mitigated by tag existence check)
- Release workflow depends on ci.yml for tag creation (tight coupling)
- Benefits: fully automated releases with no manual intervention

---

### 025: Skip CI Jobs on Release Tag Push

**Status:** Accepted

**Why:**

- Avoid redundant CI runs when triggered by release tag push
- Release tags are created after CI passes on main merge, so re-running CI is unnecessary
- Reduce CI resource usage and wait times for release process

**Changes:**

1. **Quality Checks job** (`ci.yml`):
   - Added condition: `(github.event_name != 'push' || !startsWith(github.ref, 'refs/tags/'))`
   - Skips when triggered by tag push

2. **Tests & Build job** (`ci.yml`):
   - Added same condition: `(github.event_name != 'push' || !startsWith(github.ref, 'refs/tags/'))`
   - Skips when triggered by tag push

3. **Security Scan** and **Docker Security Scan** already skip on push (condition: `github.event_name == 'pull_request'`)

**Flow:**

```
1. PR merged to main → CI runs (quality, test, security, docker-scan)
2. create-release job creates version tag (vX.Y.Z)
3. Tag pushed → release.yml creates GitHub Release
4. CI re-runs on tag push → now skips quality and test (security/docker-scan already skipped)
```

**Tradeoffs:**

- ⚠️ Release tag push won't run quality checks (acceptable since main push already passed)
- ⚠️ If tag created manually without prior CI, jobs won't run (manual tag creation should ensure CI passed)

---

### 027: Fix Release Workflow to Push Commits to Main on PR Merge

**Status:** Accepted

**Why:**

- Prevent duplicate tag creation from repetitive release commits
- When PR merges, `GITHUB_HEAD_REF` contained PR branch name (e.g., `swe-fix`), causing commits to be pushed to PR branch
- This re-triggered CI on PR branch, creating duplicate tags

**Changes:**

Updated `ci.yml` "Commit Version Changes" step to detect merge scenario:

```bash
# Before (buggy):
BRANCH_NAME="${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}"
git push origin "$BRANCH_NAME"

# After (fixed):
if [ -n "$GITHUB_HEAD_REF" ]; then
  TARGET_BRANCH="main"
else
  TARGET_BRANCH="${GITHUB_REF#refs/heads/}"
fi
git push origin "$TARGET_BRANCH"
```

**Flow:**

1. PR merged to main → CI runs with `GITHUB_HEAD_REF` set to PR branch name
2. create-release detects merge scenario → pushes commit to `main` (not PR branch)
3. No re-trigger of CI on PR branch → no duplicate tags

**Tradeoffs:**

- ⚠️ Additional conditional logic in release workflow
- ✅ Prevents duplicate tags and wasted CI resources

---

### 029: Comptime for Build-Time Value Computation

**Status:** Accepted

**Why:**

- Eliminate runtime computation overhead for static values
- Pre-compile regex patterns at build time
- Pre-compute pagination ranges for common page counts (≤20)
- Centralize constant values in one location

**Implementation:**

1. **Dependencies**: Added `comptime` package (`@lukeed/comptime`)

2. **Vite Integration** (`vite.config.ts`):

   ```typescript
   import { comptime } from "comptime/vite";
   // ...
   plugins: [comptime(), ...]
   ```

3. **Module Structure** (`src/lib/comptime/`):

   ```
   ├── values.ts    # Raw constant values (source of truth)
   └── index.ts     # Build-time computed exports via comptime()
   ```

4. **Values Exported** (15+ constants):
   - `ROLE_HIERARCHY` - Role permission levels
   - `ADMIN_ROLES`, `MANAGER_ROLES`, `ALL_ROLES` - Role arrays
   - `DASHBOARD_VIEWS`, `DASHBOARD_VIEW_LEVELS` - View types and levels
   - `HTTP_STATUS_TO_ERROR_MAP` - Status code to error class mapping
   - `HTML_ENTITIES_MAP` - HTML entity encoding
   - `SUSPICIOUS_PATTERNS` - XSS detection patterns
   - `DANGEROUS_TAGS_PATTERN`, `EVENT_HANDLER_PATTERN`, `HTML_PATTERN` - Pre-compiled regex
   - `PAGINATION_MAX_VISIBLE` - Max visible pages
   - `COMMON_PAGINATION_RANGES` - Pre-computed pagination ranges

5. **Pagination Optimization**:
   - `COMMON_PAGINATION_RANGES_VALUES` pre-computed for pages 1-20
   - `utils/index.ts` imports directly from `values.ts` (avoids runtime `comptime()` call)
   - Fallback to runtime computation for >20 pages

**Tradeoffs:**

- ⚠️ Additional build step (minimal impact)
- ⚠️ Cannot use in test files without preload (solved by exporting raw values)
- ✅ Zero runtime overhead
- ✅ Pre-compiled regex patterns
- ✅ Centralized constant management

---

### 030: Scratch-Based Docker Runtime for Minimal Attack Surface

**Status:** Accepted

**Why:**

- Reduce Docker image size from ~150-200MB to ~70-85MB
- Eliminate Alpine OS packages that may contain CVEs
- Minimal attack surface with no shell, package manager, or OS utilities
- Reproducible builds without network dependency during extraction

**Implementation:**

Created multi-stage Dockerfile with 4 stages:

| Stage        | Base Image        | Purpose                              |
| ------------ | ----------------- | ------------------------------------ |
| `deps`       | `oven/bun:alpine` | Install production dependencies only |
| `builder`    | `oven/bun:alpine` | Build application (Vite + SSR)       |
| `extractor`  | `oven/bun:alpine` | Extract Bun binary + CA certs        |
| `production` | `scratch`         | Minimal runtime (Bun binary + app)   |

**Key Changes:**

1. **Dockerfile (`docker/Dockerfile`)**:
   - Stage 3 (extractor) extracts `/usr/bin/bun` and CA certificates from Alpine
   - Stage 4 (production) uses `scratch` base image
   - Copies Bun binary, app dist, package.json, and CA certs
   - Runs `bun install --omit=dev` for production deps
   - No shell available, no health check (wget not in scratch)

2. **Docker Compose (`docker/docker-compose.yml`)**:
   - Removed health check from app service (wget unavailable in scratch)
   - App relies on Docker's default restart behavior

**Tradeoffs:**

- ⚠️ No shell available in production container (can't exec in for debugging)
- ⚠️ No health check (Docker can't auto-restart on crash)
- ⚠️ Can't run additional commands after container starts
- ✅ Minimal size (~70-85MB)
- ✅ No OS vulnerabilities
- ✅ Fast cold start (~1-2s)

---

### 028: User Management Dialog with Password Validation

**Status:** Completed

**Why:**

- Add user creation/editing dialog with password validation
- Show password strength requirements indicator (8+ chars, lowercase, number)
- Show password match/mismatch indicator for confirmation
- Improve username generation from name (handles special characters)
- Fix form submission via TanStack Form integration

**Implementation:**

1. **Form Component** (`src/components/ui/form.tsx`):
   - Updated `FormField` to read errors from `state.errors.[name].[0]`
   - Changed `Form.onSubmit` to call `form.handleSubmit()` for native form submission
   - Moved submit button inside `<Form>` component for proper form submission

2. **User Action Dialog** (`src/features/users/components/users-action-dialog.tsx`):
   - Added password strength requirements indicator
   - Added password match/mismatch indicator with visual feedback
   - Improved username generation: removes special characters from names
   - Fixed form submission: removed encoded password (API handles hashing internally)

3. **Sign-Up Form** (`src/features/auth/sign-up/components/sign-up-form.tsx`):
   - Added password match indicator similar to user dialog

4. **API** (`src/routes/api/users/-core.ts`):
   - Fixed `auth.api.signUpEmail()` call with correct `body` wrapper
   - Updated role validation to accept all 5 roles (user, cashier, manager, admin, superadmin)

5. **Tests**:
   - Unit tests: `test/features/users/schema.test.ts` (20 tests)
   - E2E tests: `.e2e/routes/_authenticate/dashboard/users.spec.ts`

**Changes:**

| File                                                    | Change                                       |
| ------------------------------------------------------- | -------------------------------------------- |
| `src/components/ui/form.tsx`                            | Fix FormField error retrieval, Form.onSubmit |
| `src/features/users/components/users-action-dialog.tsx` | Add password indicators, fix form submission |
| `src/features/auth/sign-up/components/sign-up-form.tsx` | Add password match indicator                 |
| `src/routes/api/users/-core.ts`                         | Fix signUpEmail call, update role validation |
| `test/features/users/schema.test.ts`                    | New unit tests (20 tests)                    |
| `.e2e/routes/_authenticate/dashboard/users.spec.ts`     | E2E tests                                    |

**Tradeoffs:**

- ⚠️ More complex form component logic
- ✅ Better user feedback with visual indicators
- ✅ Improved username generation handles international names

---

## Rules

- Every major decision MUST be logged
- Do NOT log trivial choices
- Keep entries short but meaningful

## When to Add a Decision

Add when:

- Introducing new infrastructure
- Changing architecture
- Replacing core library
- Adding new protocol/system (e.g., MCP)

Do NOT add when:

- Fixing bugs
- Refactoring code
- Minor optimizations