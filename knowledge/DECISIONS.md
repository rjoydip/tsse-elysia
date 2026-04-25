# DECISIONS.md

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
- Used react-hook-form with Zod resolver for form handling and validation
- Integrated with TanStack Store profile state for data persistence
- Added loading states and error handling for form submission
- Implemented dynamic URL field management with useFieldArray hook

**Tradeoffs:**

- Increased bundle size due to additional dependencies (zod, react-hook-form)
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

## Rules

- Every major decision MUST be logged
- Do NOT log trivial choices
- Keep entries short but meaningful

---

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