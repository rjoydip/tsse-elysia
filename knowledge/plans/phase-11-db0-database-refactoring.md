# Database Refactoring Plan: Migrate to DB0 Library

## Overview

This plan outlines the refactoring of the current database setup to use the DB0 library with conditional configuration for different environments:

- Unit/E2E testing: SQLite memory database
- Local/DEV: SQLite file-based database
- Non-dev (Staging/QA/Prod): PostgreSQL

## Current State Analysis

- **Database Library**: Drizzle ORM with direct SQLite/PostgreSQL drivers
- **Initialization**: `src/config/db/index.ts`
- **Schema**: `src/schema/core.ts` (Drizzle schema definitions)
- **Auth Integration**: Better Auth with drizzle-adapter in `src/lib/auth/index.ts`
- **Testing**: SQLite in-memory databases in test fixtures

## Why DB0?

DB0 provides:

- Unified API for multiple databases (SQLite, PostgreSQL)
- Automatic connection pooling
- Built-in retry mechanisms
- Type-safe query building
- Zero-configuration for common use cases
- Better performance characteristics than direct drivers

## Implementation Plan

### Phase 1: Preparation (Estimated: 2 hours)

1. Install DB0 library: `bun add db0`
2. Audit current database usage across codebase
3. Create backup of current database implementation
4. Identify all files requiring modification

### Phase 2: Core Database Abstraction (Estimated: 4 hours)

Create new database layer in `src/config/db/index.ts` that:

- Uses DB0 as underlying driver
- Maintains identical interface to current Drizzle setup:
  - `getWriteDb()` - for write operations
  - `getReadDb()` - for read operations (with replica support)
  - `getDatabasePools()` - for health checks
  - `getDatabasePoolConfigs()` - for health check reporting
- Implements environment-specific configuration

### Phase 3: Environment Configuration (Estimated: 2 hours)

Implement conditional database setup:

- **Test/E2E**: DB0 with SQLite in-memory (`:memory:`)
- **Local/Dev**: DB0 with SQLite file-based (`.artifacts/tsse-elysia.db`)
- **Non-dev**: DB0 with PostgreSQL connection pooling

### Phase 4: Better Auth Integration (Estimated: 3 hours)

Update authentication layer in `src/lib/auth/index.ts`:

- Create/adapt DB0 adapter for Better Auth
- Ensure schema compatibility with existing tables
- Maintain all existing authentication functionality
- Verify Argon2id password hashing continues to work

### Phase 5: Testing Updates (Estimated: 3 hours)

Update test infrastructure:

- Modify `test/fixtures/db.ts` to use DB0
- Update `test/lib/db.test.ts` and related test files
- Ensure all existing unit and E2E tests pass
- Verify test isolation and cleanup works correctly

### Phase 6: Migration Script Updates (Estimated: 2 hours)

Update database scripts in package.json:

- `db:generate`, `db:migrate`, `db:push`, `db:seed`
- Ensure schema migrations work with DB0
- Update any raw SQL usage if needed

### Phase 7: Validation & Cleanup (Estimated: 2 hours)

- Run full test suite to ensure no regressions
- Verify performance characteristics
- Clean up any temporary code or backups
- Update documentation as needed

## Files to Modify

### Primary Changes:

1. `src/config/db/index.ts` - Main database initialization and abstraction layer
2. `src/schema/core.ts` - Database schema definitions
3. `src/lib/auth/index.ts` - Better Auth adapter integration
4. `test/fixtures/db.ts` - Test database setup
5. `test/lib/db.test.ts` - Database unit tests

### Secondary Changes:

6. Package.json scripts - Database migration/update commands
7. Any files using raw database connections directly
8. Documentation files referencing database setup

## Risk Mitigation Strategy

### Backward Compatibility

- Maintain identical export interface from `src/config/db/index.ts`
- Ensure all existing consumers (auth, routes, etc.) work without changes
- Keep same function signatures and return types

### Gradual Validation

- Implement feature flag to compare DB0 vs current implementation
- Run both implementations in parallel during transition
- Validate behavior matches before complete cutover

### Testing Approach

- Achieve 80%+ test coverage on new database layer before deployment
- Focus on critical paths: auth, user operations, subscriptions
- Verify E2E tests pass with both SQLite and PostgreSQL configurations

## Success Criteria

### Functional Requirements

1. [ ] All existing unit tests pass (718 tests)
2. [ ] All E2E tests pass
3. [ ] Database initialization works correctly in all environments
4. [ ] Better Auth functions correctly (login, registration, sessions)
5. [ ] Read/write database separation works as expected
6. [ ] Health check endpoints return correct database information

### Performance Requirements

1. [ ] Database query performance is maintained or improved
2. [ ] Connection pooling works correctly in PostgreSQL environment
3. [ ] No memory leaks or connection exhaustion issues
4. [ ] Test execution time is not significantly increased

### Operational Requirements

1. [ ] Database migrations work correctly with DB0
2. [ ] Local development setup remains simple
3. [ ] CI/CD pipeline continues to function
4. [ ] Docker deployment (if applicable) works without changes

## Dependencies

- DB0 library (to be installed)
- Potential need for DB0 adapters for Better Auth (if not available)
- Continued use of Drizzle schema definitions (may need adaptation)

## Rollback Plan

1. Keep backup of original `src/config/db/index.ts` and related files
2. Maintain ability to revert to Drizzle implementation via git
3. Feature flag approach allows gradual rollback if needed
4. Comprehensive test suite provides validation before/after

## Next Steps

1. Approve this plan
2. Begin implementation with Phase 1 (Preparation)
3. Schedule regular check-ins during implementation
4. Plan for testing and validation phases
5. Prepare rollback procedures