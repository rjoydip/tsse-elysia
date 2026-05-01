# Better Result Integration Plan

## 1. Library Overview

`better-result` provides a type-safe `Result<T, E>` type (Ok/Err) to replace try/catch, with:

- Generator-based composition (`Result.gen`)
- Tagged errors for exhaustive matching
- Async operation support with retry logic
- Serialization for RPC/storage

---

## 2. Pre-Integration Setup

### Step 1: Add Dependency

```bash
bun add better-result
```

**Rationale**: Required to use Result types across the codebase.

---

## 3. Integration by Target Folder

### A. `src/lib` (Core Utilities)

**Files to modify/create**:

1. **Create `src/lib/result.ts`**:
   - Re-export `Result`, `Ok`, `Err`, `TaggedError` from `better-result`
   - Define common tagged errors matching existing `AppError` patterns:

     ```typescript
     export class DatabaseError extends TaggedError("DatabaseError")<{
       message: string;
       query?: string;
     }>() {}

     export class NotFoundError extends TaggedError("NotFoundError")<{
       resource: string;
       id: string;
     }>() {}

     export class ValidationError extends TaggedError("ValidationError")<{
       field: string;
       message: string;
     }>() {}
     ```

   - Add utility to convert existing `AppError` to Result types for backward compatibility.

2. **Update `src/lib/errors.ts`**:
   - Deprecate `AppError` in favor of tagged errors, or add a `toResult()` method to `AppError`.

---

### B. `src/repositories` (Data Access Layer)

**Current State**: Repository methods (e.g., `McpApiKeyRepository`) return raw values/`null`, with unhandled Drizzle ORM errors.

**Plan**:

1. Refactor all repository methods to return `Result<T, TaggedError>`:
   - Use `Result.tryPromise` to wrap Drizzle async operations:

     ```typescript
     // Before (api-keys.repository.ts)
     async insertKey(data: {...}): Promise<McpApiKey> {
       const [record] = await db.insert(mcpApiKeys).values({...}).returning();
       return record;
     }

     // After
     async insertKey(data: {...}): Promise<Result<McpApiKey, DatabaseError>> {
       return Result.tryPromise(
         async () => {
           const [record] = await db.insert(mcpApiKeys).values({...}).returning();
           return record;
         },
         (error) => new DatabaseError({ message: error.message })
       );
     }
     ```

2. Define repository-specific error types (e.g., `DuplicateKeyError` for unique constraint violations).
3. **Target files**: All files in `src/repositories/` (e.g., `mcp/api-keys.repository.ts`, `settings/*.repository.ts`).

---

### C. `src/controllers` (Request Handling Layer)

**Current State**: Controllers call services/repositories and handle errors via try/catch.

**Plan**:

1. Update controllers to consume Result types from repositories (or services):
   - Use `Result.match` to format HTTP responses:
     ```typescript
     // Elysia controller example
     .get("/keys/:id", async ({ params, error }) => {
       const result = await mcpApiKeyRepository.findKeyByIdAndUserId(params.id, userId);
       return result.match({
         ok: (key) => key,
         err: (e) => error(404, { message: "Key not found" })
       });
     })
     ```
2. Map tagged errors to HTTP status codes (e.g., `NotFoundError` → 404, `DatabaseError` → 500).
3. **Target files**: `src/controllers/mcp/keys.controller.ts`, `src/controllers/settings/controller.ts`.

---

### D. `src/middlewares` (HTTP Middlewares)

**Current State**: Middlewares like `rate-limit.ts` use Redis, which can fail silently.

**Plan**:

1. Add a global error-handling middleware to convert unhandled Result errors to HTTP responses.
2. Refactor error-prone middlewares to return Results:
   - Example: Rate-limit middleware wraps Redis calls in `Result.tryPromise`.
3. **Target files**: `src/middlewares/rate-limit.ts`, `src/middlewares/index.ts`.

---

### E. `src/config` (Configuration Layer)

**Current State**: Config files (e.g., `env.ts`, `db/index.ts`) may throw errors on invalid configuration.

**Plan**:

1. Refactor config validation to return `Result<T, ConfigError>` instead of throwing:
   - Example: `src/config/env.ts` validates env vars and returns `Result<EnvConfig, ValidationError>`.
2. **Target files**: `src/config/env.ts`, `src/config/db/index.ts`.

---

### F. `src/plugins` (Elysia Plugins)

**Current State**: Plugins like `evlog-plugin.ts` or `websocket.ts` may have connection/initialization errors.

**Plan**:

1. Wrap plugin initialization logic in Results to handle failures gracefully.
2. **Target files**: `src/plugins/evlog-plugin.ts`, `src/plugins/websocket.ts`.

---

## 4. Phased Migration Strategy

| Phase | Scope                                                             | Verification                                                       |
| ----- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1     | Add `better-result` dep, create `src/lib/result.ts`               | `bun run typecheck`, `bun run lint:fix`                            |
| 2     | Refactor all repositories to return Results                       | `bun test test/services/` (if services exist), `bun run typecheck` |
| 3     | Update controllers to handle Result types                         | `bun test test/controllers/`, E2E tests for API endpoints          |
| 4     | Update middlewares, config, plugins                               | `bun run lint:check`, `bun test`                                   |
| 5     | Deprecate old `AppError` and clean up unused error handling codes | `bun run fallow:dead`                                              |

---

## 5. Key Benefits

- Explicit error types in function signatures (type-safe error handling)
- Eliminate unhandled try/catch blocks
- Consistent error handling across all layers
- Aligns with the project's layered architecture (Repository → Controller → HTTP)

---

## 6. Implementation Status (as of 2026-05-01)

### Completed

- ✅ Phase 1: Added `better-result` dependency
- ✅ Created `src/lib/result.ts` with tagged errors (DatabaseError, NotFoundError, ValidationError, ConfigError, RateLimitError, DuplicateKeyError)
- ✅ Added `appErrorToResult()` utility for backward compatibility
- ✅ Updated `src/lib/errors.ts` with deprecation notice for AppError
- ✅ Refactored `src/repositories/mcp/api-keys.repository.ts` to return Result types
- ✅ Refactored `src/repositories/settings/profile.repository.ts` to return Result types
- ✅ Refactored `src/services/mcp/api-keys.service.ts` to handle Result types
- ✅ Updated `src/controllers/mcp/keys.controller.ts` with error mapping
- ✅ Updated routes to use new controller functions
- ✅ Added unit tests for `result.ts` (42 tests) and `errors.ts` (24 tests)
- ✅ All 985 tests passing

### Remaining

- Phase 2: Refactor other repositories (account, display, notifications)
- Phase 3: Update remaining controllers and services to handle Result types
- Phase 4: Update middlewares (rate-limit), config (env.ts, db/index.ts), plugins (evlog-plugin, websocket)
- Phase 5: Deprecate old AppError and clean up unused error handling code

---

## 7. Next Steps

1. Complete repository refactoring (Phase 2)
2. Update controllers and services (Phase 3)
3. Update middlewares, config, and plugins (Phase 4)
4. Clean up and deprecate old error handling (Phase 5)