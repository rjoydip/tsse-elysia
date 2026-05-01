# API Architecture Refactoring Tasks

## Overview

API routes refactoring to implement a layered architecture (HTTP → Controller → Service → Repository).

## Task Status

| Task                                | Status | Notes                                                     |
| ----------------------------------- | ------ | --------------------------------------------------------- |
| Audit `src/routes/api` structure    | ✅     | Mapped all files, classified by layer                     |
| Create `src/controllers/`           | ✅     | HTTP-specific logic (session validation, request parsing) |
| Create `src/repositories/`          | ✅     | ORM operations with interface-based design                |
| Add barrel files (index.ts)         | ✅     | All new layers have barrel exports                        |
| Refactor MCP API keys               | ✅     | Moved ORM to repository, business logic to service        |
| Create MCP controller               | ✅     | `src/controllers/mcp/keys.controller.ts`                  |
| Refactor Settings API               | ✅     | Profile, account, display, notifications                  |
| Create Settings controller          | ✅     | `src/controllers/settings/controller.ts`                  |
| Update services to use repositories | ✅     | All settings services now use repositories                |
| Run typecheck                       | ✅     | Passes with 0 errors                                      |
| Run lint                            | ✅     | oxlint passes with 0 warnings                             |
| Run unit tests                      | ✅     | 932 pass, 0 fail                                          |
| Update README.md                    | ✅     | Added API Architecture section with diagram               |
| Update PLANS.md                     | ✅     | Added Phase 11, updated task status                       |

## Completed Implementation Details

### 1. Repository Layer (`src/repositories/`)

**Files created:**

- `src/repositories/mcp/api-keys.repository.ts` - MCP API keys ORM operations
- `src/repositories/settings/profile.repository.ts` - Profile settings ORM
- `src/repositories/settings/account.repository.ts` - Account settings ORM
- `src/repositories/settings/display.repository.ts` - Display settings ORM
- `src/repositories/settings/notifications.repository.ts` - Notification settings ORM
- `src/repositories/index.ts` - Barrel file
- `src/repositories/settings/index.ts` - Settings barrel file

**Interfaces defined:**

```typescript
interface IMcpApiKeyRepository { ... }
interface IProfileRepository { ... }
interface IAccountRepository { ... }
interface IDisplayRepository { ... }
interface INotificationsRepository { ... }
```

### 2. Controller Layer (`src/controllers/`)

**Files created:**

- `src/controllers/mcp/keys.controller.ts` - MCP key validation, response formatting
- `src/controllers/settings/controller.ts` - Session validation, response helpers
- `src/controllers/index.ts` - Barrel file
- `src/controllers/mcp/index.ts` - MCP barrel file
- `src/controllers/settings/index.ts` - Settings barrel file

### 3. Service Layer Updates (`src/services/`)

**Files updated:**

- `src/services/dashboard/settings/profile.ts` - Now uses `profileRepository`
- `src/services/dashboard/settings/account.ts` - Now uses `accountRepository`
- `src/services/dashboard/settings/display.ts` - Now uses `displayRepository`
- `src/services/dashboard/settings/notifications.ts` - Now uses `notificationsRepository`
- `src/services/dashboard/settings/types.ts` - New shared types file

### 4. HTTP Layer Updates (`src/routes/api/`)

**Files updated:**

- `src/routes/api/mcp/-keys.ts` - Now uses controller + service
- `src/routes/api/settings/-profile.ts` - Now uses controller + service
- `src/routes/api/settings/-account.ts` - Now uses controller + service
- `src/routes/api/settings/-display.ts` - Now uses controller + service
- `src/routes/api/settings/-notifications.ts` - Now uses controller + service

### 5. Backward Compatibility

**File updated:**

- `src/lib/mcp/api-keys.ts` - Now re-exports from new service (for existing imports)

## Benefits Achieved

1. **Separation of Concerns** - Each layer has a single responsibility
2. **Testability** - Repositories and services can be unit tested in isolation
3. **Maintainability** - Changes in one layer don't affect others
4. **Scalability** - New API modules can follow the same pattern
5. **Type Safety** - Interface-based design with proper TypeScript types

## Next Steps (Optional)

- [ ] Refactor remaining routes in `src/routes/api/` to use controllers
- [ ] Add unit tests for new controllers and repositories
- [ ] Create E2E tests for refactored API endpoints
- [ ] Document controller patterns in `docs/api/`