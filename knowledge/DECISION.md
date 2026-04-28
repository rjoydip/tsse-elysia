# Decision: API Layered Architecture

## Status

✅ **Accepted** (Implemented)

## Context

The `src/routes/api/` directory contained a mix of HTTP handling, business logic, and ORM operations. This monolithic structure made the codebase harder to maintain, test, and scale. Specifically:

1. **MCP API keys** (`src/routes/api/mcp/-keys.ts`) contained both ORM queries and business logic
2. **Settings API** (`src/routes/api/settings/*`) mixed session validation with database operations
3. **Services** (`src/services/dashboard/settings/*`) contained inline ORM logic instead of delegating to repositories
4. **No clear separation** between HTTP concerns, business rules, and data access

## Decision

Implement a **layered architecture** with clear separation of concerns:

```
HTTP Layer (routes/) → Controller Layer (controllers/) → Service Layer (services/) → Repository Layer (repositories/)
```

### Layer Responsibilities

| Layer          | Directory           | Responsibility                                           |
| -------------- | ------------------- | -------------------------------------------------------- |
| **HTTP**       | `src/routes/api/`   | Route definitions, HTTP handling, OpenAPI docs           |
| **Controller** | `src/controllers/`  | Session validation, request parsing, response formatting |
| **Service**    | `src/services/`     | Business logic, data transformation, validation rules    |
| **Repository** | `src/repositories/` | ORM operations, database queries, data access            |

## Rationale

### 1. **Separation of Concerns**

- Each layer has a single, well-defined responsibility
- Changes in business logic don't affect HTTP handling
- Database schema changes don't impact business rules

### 2. **Testability**

- Repositories can be mocked for service tests
- Services can be tested in isolation
- Controllers can be unit tested with mock services

### 3. **Maintainability**

- Clear file locations for different types of logic
- Easier onboarding for new developers
- Consistent patterns across all API modules

### 4. **Scalability**

- New API modules follow the same pattern
- Layers can be extended independently
- Supports future requirements (caching, logging, etc.)

### 5. **Interface-Based Design**

- Repositories use interfaces for abstraction
- Services depend on abstractions, not concretions
- Enables dependency injection for testing

## Alternatives Considered

### Alternative 1: Keep Monolithic Route Handlers

- ❌ Mixes concerns in single files
- ❌ Harder to test in isolation
- ❌ Business logic tied to HTTP framework

### Alternative 2: Service-Only Pattern (no repositories)

- ❌ Services still contain ORM logic
- ❌ Database concerns mixed with business rules
- ❌ Harder to switch ORMs or databases

### Alternative 3: CQRS Pattern

- ❌ Overkill for current project size
- ❌ Increased complexity
- ❌ Steeper learning curve

## Consequences

### Positive

- ✅ Clear separation of concerns
- ✅ Improved testability
- ✅ Better maintainability
- ✅ Consistent patterns
- ✅ Type-safe interfaces
- ✅ Backward compatible (re-exports in `src/lib/mcp/api-keys.ts`)

### Negative

- ⚠️ More files to manage (mitigated by barrel exports)
- ⚠️ Slightly more complex for simple endpoints
- ⚠️ Learning curve for developers unfamiliar with pattern

## Implementation Details

### Repository Layer

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

### Service Layer

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

### Controller Layer

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

### HTTP Layer

```typescript
export const mcpKeysRoutes = new Elysia({ prefix: "/keys" }).get("/", async ({ apiKey }) => {
  const { error, userId } = await validateSession(request, set);
  if (error) return error;
  return mcpApiKeyService.listApiKeys(userId);
});
```

## Validation

- ✅ TypeScript typecheck passes (0 errors)
- ✅ oxlint passes (0 warnings, 0 errors)
- ✅ All 932 unit tests pass
- ✅ E2E tests continue to pass
- ✅ Backward compatibility maintained

## References

- [README.md - API Architecture](./README.md#api-architecture)
- [PLAN.md - Phase 11](./PLAN.md#phase-11--api-architecture-refactoring-)
- [TASK.md](./TASK.md) - Detailed task list
- [AGENTS.md](./AGENTS.md) - Coding guidelines