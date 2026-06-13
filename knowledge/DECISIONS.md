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

4. **Database Schema** (`src/lib/db/users.ts`):
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
   - Updated role validation to accept all 4 roles (user, cashier, manager, admin)

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

### 034: AnimatedNumber Component for Number Transitions

**Status:** Accepted

**Why:**

- Dashboard metric cards needed smooth animated number transitions on value change
- Existing libraries (calligraph, torph) were over-engineered character-diff approaches
- Wanted a lightweight, reusable component with configurable animation presets

**Approach:**

- Created `AnimatedNumber` component using `motion` + `AnimatePresence` for enter/exit transitions
- Initial render shows 0, then transitions to real value via `requestAnimationFrame` for a visible 0→value animation on mount
- Added `enterDelay` prop to align number transitions with staggered parent card entrance animations (solved race condition where cards with entrance delay > 0 hid the number animation)
- Configurable animation presets: bounce (default), fadeScale, slideUp, pop, gentle

**Alternatives Considered:**

- `calligraph` and `torph` libraries — removed, were too heavy for simple number transitions
- Inline `AnimatePresence`/`motion.span` patterns — replaced everywhere with reusable component
- CSS-only transitions — couldn't achieve key-based enter/exit behavior

**Tradeoffs:**

- ✅ Consistent animation behavior across all dashboard views
- ✅ Removed 2 unused dependencies (calligraph, torph)
- ✅ Single source of truth for number animations
- ⚠️ Requires `motion` library (already a dependency)

---

### 035: Consolidated Metric Cards in Dashboard Overview

**Status:** Accepted

**Why:**

- "Total Revenue" and "Sales" cards displayed fake/mock data (no real revenue tracking in this app)
- "Active Users", "Inactive Users", "Suspended Users" cards were duplicated between Overview and Analytics tabs
- User-focused metrics belong on the primary Overview tab, not hidden under Analytics

**Approach:**

- Removed "Total Revenue" and "Sales" cards from Overview
- Moved "Active Users", "Inactive Users", "Suspended Users" from Analytics to Overview
- Analytics tab now focuses exclusively on charts (Weekly Registrations, Users by Role, Users by Status)
- Color-coded each card type: Total Users → purple, Active Users → cyan, Inactive Users → amber, Suspended Users → red, Active Now → emerald
- Made all cards equal height with `h-full` on Card and motion.div wrappers

**Tradeoffs:**

- ✅ Overview now shows all 5 user-focused metric cards
- ✅ Analytics tab is cleaner (charts only)
- ✅ No more fake "revenue/sales" data displayed
- ⚠️ Overview tab is denser with 5 cards in a row

---

### 036: HMR-safe Database Initialization via globalThis Flags

**Status:** Accepted

**Why:**

- Vite HMR re-evaluates ES module files on every save, causing `initializeDatabase()` to run again (and crash because the database is already initialized or the pool is closed)
- Module-level `let db`, `let initialized`, `let sqliteClient`, `let pgPoolPrimary`, `let pgPoolsReplicas` all reset to `undefined` on HMR
- Need persisting initialization state across HMR cycles without preventing legitimate module updates

**Implementation:**

- Used `globalThis` flags to track initialization state:
  ```typescript
  if (!(globalThis as any).__DB_INITIALIZED) {
    await initializeDatabase();
    (globalThis as any).__DB_INITIALIZED = true;
  }
  ```
- Persisted `db`, `sqliteClient`, `pgPoolPrimary`, `pgPoolsReplicas` on `globalThis` and restored them on re-import:
  ```typescript
  let db: DbType = (globalThis as any).__DB;
  let sqliteClient: Client | null = (globalThis as any).__SQLITE_CLIENT;
  ```
- Applied same pattern to cache storage in `src/lib/cache/index.ts`

**Alternatives Considered:**

- `import.meta.hot.data` — more Vite-idiomatic but doesn't work in production builds, and is Vite-specific; `globalThis` works everywhere
- Top-level `try/catch` around initialization — fragile, doesn't prevent re-execution
- Singleton module — not compatible with HMR's module replacement semantics

**Tradeoffs:**

- ⚠️ `globalThis` is a global namespace (potential collisions, mitigated by `__DB_` prefix convention)
- ⚠️ Requires explicit cleanup in tests (`closeStorage()` clears the global key)
- ✅ Works in both dev (HMR) and production
- ✅ No external dependencies

---

### 037: Client-Side Dashboard Hooks with fetch() Instead of Direct Service Imports

**Status:** Accepted

**Why:**

- Dashboard hooks (`use-dashboard-metrics`, `use-dashboard-analytics`, etc.) were directly importing `dashboardService` from server-side code
- `dashboardService` requires `db` — a server-only resource that doesn't exist in the browser
- Vite bundled these imports into the client bundle, causing runtime crashes on page load (`require is not defined`, `pg is not defined`)
- Client-side code must never import server-only Node.js modules

**Implementation:**

- Rewrote 5 hooks to use `fetch("/api/dashboard/...")` instead of importing `dashboardService`
- Each hook manages its own loading/error/data state independently
- Hooks parse JSON responses and apply the same type transformations as the old service calls
- Replaced direct Eden Treaty client usage in `role-based-views.tsx` with raw `fetch()` calls

**Alternatives Considered:**

- Dynamic imports with type guarding — complex and fragile
- Server-only barrel files — adds indirection without solving bundle problem
- `virtual:module` pattern — over-engineered for this use case

**Tradeoffs:**

- ⚠️ No TypeScript type safety on fetch responses (must manually type or validate at runtime)
- ⚠️ No Eden Treaty endpoint discovery (URL strings are not checked at compile time)
- ✅ Zero server code in client bundle
- ✅ Simple, debuggable network requests
- ✅ Works with any HTTP framework, not tied to Elysia

---

### 038: Auth Sync Race Fix with Deferred setSession

**Status:** Accepted

**Why:**

- `useAuthSync` hook in `sync.ts` was calling `authActions.setSession(mappedSession)` synchronously when it detected a session cookie
- `mappedSession` does not include the `role` field — it's a subset of the full user object
- Immediately after `setSession`, the same hook fetches `/api/users/me` to get the full user object (including `role`)
- This caused a visible flash: dashboard renders with `role: undefined` → user sees wrong dashboard → role resolves → dashboard re-renders correctly
- The race condition was exposed by React StrictMode's double-invocation

**Implementation:**

- Moved `authActions.setSession(mappedSession)` inside the `/api/users/me` fetch callback, so the auth store is never written with a user object lacking the `role` array
- Added `syncedSessionId` ref to deduplicate React StrictMode double-invocations:
  ```typescript
  const syncedSessionId = useRef<string | null>(null);
  if (sessionId && syncedSessionId.current === sessionId) return;
  syncedSessionId.current = sessionId;
  ```
- Updated `usePermission` hook: `isPending` now also returns `true` when the session has a user but the auth store hasn't been updated yet

**Alternatives Considered:**

- Merging role into the session cookie on the server — would require changing the auth library's cookie format
- Separate `useRole` hook — still has race condition between auth store and role fetch
- Optimistic role display — complex, error-prone logic for guessing the role

**Tradeoffs:**

- ⚠️ Slightly slower initial dashboard render (waits for two sequential requests)
- ✅ No dashboard flash — user always sees the correct view on first render
- ✅ Clean separation: auth store always has complete user data

---

### 039: Production-Aware Database Seeding with Graph Data

**Status:** Accepted

**Why:**

- The seed script generated identical data regardless of environment — 4 static users + fake users every time
- In production, fake users with generated UUIDs pollute the database and have no real business value
- The dashboard charts showed flat lines because all fake users had the same `createdAt` timestamp (the current time when `generateFakeUsers()` was called for each batch)
- Need meaningful chart data in dev without leaking fake data to production

**Implementation:**

- Added `--prod` CLI flag and `NODE_ENV=production` detection to seed script
- Split seed configuration:
  - `ESSENTIAL_USERS` (admin) — created in all environments
  - `DEV_USERS` (manager, cashier, user) — created only in dev mode
- **Graph-friendly timestamps in dev mode**:
  - 80% of fake users distributed across all 12 months of the current year (each call iteration selects a unique month + day, creating a realistic monthly registration curve)
  - 20% of fake users distributed across the last 7 days (for the weekly registrations chart)
- Used `faker.seed()` for deterministic, reproducible output
- CLI flags: `--fresh` (reset DB), `--count=N` (override fake user count), `--seed=N` (override faker seed), `--prod` (production mode)

**Alternatives Considered:**

- Environment variable `SEED_MODE=production` — works but less discoverable than a CLI flag
- Separate seed scripts (`db-seed:prod`, `db-seed:dev`) — code duplication
- Auto-detect by checking if server is running — unreliable and fragile

**Tradeoffs:**

- ⚠️ Two code paths for seeding (more to test)
- ⚠️ `--prod` flag must be explicitly passed (failsafe: production defaults to safe behavior)
- ✅ Production database gets only real admin accounts
- ✅ Charts show meaningful registration curves out of the box
- ✅ Deterministic seeds for reproducible CI tests

---

### 040: Nightly Dev Build Workflow

**Status:** Accepted

**Date:** 2026-06-01

**Why:**

- Provide daily development builds for testing and validation
- Catch regressions early with full test suite + E2E runs on a schedule
- Make latest changes available as pre-built artifacts without requiring a formal release
- Establish a consistent nightly cadence independent of PR merges

**Approach:**

- GitHub Actions scheduled workflow at midnight UTC (cron: `0 0 * * *`)
- Runs full quality checks (lint, typecheck), unit tests with coverage, E2E tests, and production build
- Creates a "Nightly" GitHub Release (prerelease) with build artifacts (tarball + zip)
- Version scheme: `0.0.0-dev.<YYYYMMDD>.<short-sha>` — unique per day, no semver bumps
- Retains last 30 run artifacts; older ones pruned automatically
- Also triggerable manually via `workflow_dispatch`

**Alternatives Considered:**

- Separate cron job on a dedicated server — more maintenance overhead than GitHub-hosted runner
- Docker-based nightly image push to registry — adds complexity; not needed until container registries are in use
- Publish to npm as `dev` tag — overkill; app is not a library

**Tradeoffs:**

- ⚠️ Nightly release tag is overwritten each day (single "nightly" tag, not versioned)
- ⚠️ Uses built-in `secrets.GITHUB_TOKEN` (aliased via `env: GH_TOKEN` for `gh` CLI) — no user-managed PAT needed, but requires `contents: write` permission on the token
- ✅ Full CI pipeline runs daily, catching issues faster
- ✅ Artifacts available for 30 days; no manual cleanup
- ✅ No impact on PR CI or release workflow (separate concurrency group)

---

## Rules

- Every major decision MUST be logged
- Do NOT log trivial choices
- Keep entries short but meaningful

### 40: Dynamic RBAC with DB-Driven Permissions

**Status:** In Progress

**Why:**

- The existing RBAC tables (`role`, `permission`, `role_permission`) are disconnected from the user model – they store abstract definitions but no user is linked to them
- Permissions are hardcoded in `src/lib/auth/permissions.ts` (`ROLE_PERMISSIONS` map), requiring code changes to add/modify permissions
- Authorization checks are duplicated inline across route handlers (no centralized middleware)
- No controller layer exists for roles, violating the layered architecture pattern
- No UI for admin to manage roles/permissions dynamically

**Approach:**

1. **User-Role linkage**: Add `user_roles` junction table + `role_id` FK on `user`
2. **Dynamic resolver**: Create `PermissionResolver` service that reads effective permissions from DB (role-based), with in-memory cache
3. **Centralized middleware**: Elysia plugin providing `requireAuth()`, `requireRole()`, `requirePermission()`, `requireMinRole()`
4. **Controller layer**: Extract session/request parsing into `RolesController`
5. **Admin UI**: Roles management page at `/dashboard/roles` with CRUD dialogs
6. **User creation integration**: Role assignment via RBAC on user create/edit

**Alternatives Considered:**

- Keep hardcoded permissions only – simpler but requires code deploys for permission changes
- Use a policy engine (e.g., Casbin) – over-engineered for current scale
- Keep inline auth validation – violates DRY and layered architecture

**Tradeoffs:**

- ⚠️ Added complexity of DB lookups for permission checks (mitigated by caching)
- ⚠️ Migration required to link existing users to RBAC roles
- ⚠️ Two permission sources during migration (hardcoded fallback + DB source of truth)
- ✅ Permissions configurable without code changes
- ✅ Follows existing layered architecture
- ✅ Eliminates duplicate auth validation code
- ✅ Admin self-service for role management

---

## When to Add a Decision

Add when:

- Introducing new infrastructure
- Changing architecture
- Replacing core library
- Adding new protocol/system (e.g., MCP)

Do NOT do when:

- Fixing bugs
- Refactoring code
- Minor optimizations