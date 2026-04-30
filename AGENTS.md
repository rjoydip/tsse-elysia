---
title: AGENTS.md
description: Guidelines for AI coding agents working in this repository
---

## AGENTS.md

This file contains guidelines for AI coding agents working in this repository.

## Critical Documentation

Before starting any task, review these critical documents:

- [README.md](./README.md) - Project overview, tech stack, and setup
- [PLAN.md](./knowledge/PLAN.md) - Current development roadmap and task status
- [CONTRIBUTING.md](./.github/CONTRIBUTING.md) - Contribution guidelines and workflow
- [CHANGELOG.md](./CHANGELOG.md) - History of changes and releases

---

## AI/LLM Coding Standards

All AI-generated code must adhere to these standards.

### Code Commenting Requirements

- **Always add meaningful comments** to all new or modified code
- For JavaScript/TypeScript files (.js, .ts, .jsx, .tsx, .mjs, .cjs), use **JSDoc comments** for functions, classes, and complex logic
- Explain **why** (intent/purpose), not just **what** (mechanics)
- Add function-level comments describing:
  - Purpose of the function
  - Input parameters and their meaning
  - Return value and its meaning
  - Any side effects or edge cases
- Add comments to complex logic, business rules, or non-obvious implementations
- Comment any workarounds or temporary solutions with explanation

### Code Quality Standards

- **Naming**: Use meaningful, descriptive names for variables, functions, and types
- **Modularity**: Keep functions small and focused (single responsibility)
- **Error Handling**: Always handle errors appropriately (try/catch, error boundaries)
- **Type Safety**: Use explicit types; avoid `any`, prefer `unknown` or proper generics
- **Testing**: Write tests for new features and bug fixes

### Consistency Rules

- **Match existing patterns**: Follow the project's code style and structure
- **Reuse utilities**: Use existing helpers/utilities instead of duplicating code
- **Formatting**: Always run `bun run fmt` before completing any task
- **Linting**: Run `bun run lint:fix` to auto-fix issues
  - For markdown files, ensure proper markdown linting (`markdownlint`) is followed
  - Add new line at EOF
- **Type Checking**: Ensure `bun run typecheck` passes
- **Dead Code Prevention**: Run lint and typecheck to detect unused code before committing

### API Architecture Pattern

When working with API routes, follow the **layered architecture** (HTTP → Controller → Service → Repository):

```
HTTP Layer (routes/api/) → Controller Layer (controllers/) → Service Layer (services/) → Repository Layer (repositories/)
```

**Layer Responsibilities:**

| Layer          | Directory           | Responsibility                                           |
| -------------- | ------------------- | -------------------------------------------------------- |
| **HTTP**       | `src/routes/api/`   | Route definitions, HTTP handling, OpenAPI docs           |
| **Controller** | `src/controllers/`  | Session validation, request parsing, response formatting |
| **Service**    | `src/services/`     | Business logic, data transformation, validation          |
| **Repository** | `src/repositories/` | ORM operations, database queries, data access            |

**When creating new API endpoints:**

1. **HTTP Layer** (`src/routes/api/your-module/`):
   - Define Elysia routes
   - Handle HTTP details (headers, status codes)
   - Delegate to controller for validation

2. **Controller Layer** (`src/controllers/your-module/`):
   - Validate sessions (use `auth.api.getSession()`)
   - Parse and validate request bodies
   - Format responses
   - Handle HTTP-specific logic

3. **Service Layer** (`src/services/your-module/`):
   - Implement business logic
   - Transform data
   - Validate business rules
   - Orchestrate repositories

4. **Repository Layer** (`src/repositories/your-module/`):
   - ORM operations (Drizzle)
   - Database queries
   - Define interfaces for abstraction

**Reference Implementations:**

- **MCP API Keys**: `src/routes/api/mcp/-keys.ts`, `src/controllers/mcp/keys.controller.ts`, `src/services/mcp/api-keys.service.ts`, `src/repositories/mcp/api-keys.repository.ts`
- **Settings API**: `src/routes/api/settings/-profile.ts`, `src/controllers/settings/controller.ts`, `src/services/dashboard/settings/profile.ts`, `src/repositories/settings/profile.repository.ts`

**Documentation:**

- [API Architecture Decision](./knowledge/DECISIONS.md) - Full decision rationale
- [API Task List](./knowledge/TASK.md) - Implementation details
- [README - API Architecture](./README.md#api-architecture) - Visual diagram

### Dead Code Prevention & Security Scanning

This project enforces code quality and security via:

| Tool       | Configuration                                            | Detects                   |
| ---------- | -------------------------------------------------------- | ------------------------- |
| TypeScript | `tsconfig.json` - `noUnusedLocals`, `noUnusedParameters` | Unused locals, parameters |
| oxlint     | `.oxlintrc.json` - `no-unused-vars`, `no-unused-imports` | Unused variables, imports |
| Trivy      | `.github/workflows/ci.yml`                               | OS & App vulnerabilities  |

**Before committing, always verify no dead code:**

```bash
bun run lint     # Check for unused code warnings
bun run typecheck  # TypeScript unused detection
bun run lint:fix  # Auto-fix safe unused items
```

### Testing Requirements

This project uses two testing frameworks:

- **Unit Tests**: Bun (`bun test`) - Located in `test/`
- **E2E Tests**: Playwright (`bun run test:e2e`) - Located in `.e2e/`

#### Unit Tests Structure

```bash
test/
├── components/       # Component tests
│   ├── ui/          # UI component tests
│   ├── auth/        # Auth component tests
│   ├── data-table/  # Data-table tests
│   ├── docs/        # Docs tests
│   ├── layout/      # Layout tests
│   ├── profile/     # Profile tests
│   └── settings/    # Settings tests
├── config/           # Configuration tests
│   ├── db/          # Database config tests
│   ├── docs.test.ts # Docs config tests
│   └── index.test.ts
├── context/         # Context tests
├── features/        # Feature tests
│   ├── apps/       # Apps feature tests
│   ├── auth/       # Auth feature tests
│   ├── chats/      # Chats feature tests
│   ├── dashboard/ # Dashboard feature tests
│   ├── errors/     # Errors feature tests
│   ├── landing/   # Landing feature tests
│   ├── settings/  # Settings feature tests
│   ├── tasks/      # Tasks feature tests
│   └── users/      # Users feature tests
├── fixtures/       # Test fixtures
├── hooks/          # Hook tests
├── lib/            # Library tests
│   ├── auth/       # Auth tests
│   ├── cache/      # Cache tests
│   ├── dashboard/ # Dashboard tests
│   ├── mcp/       # MCP tests
│   │   └── tools/ # MCP tools tests
│   ├── rate-limit/ # Rate limit tests
│   └── store/      # Store tests
├── middlewares/    # Middleware tests
├── plugins/       # Plugin tests
├── routes/         # Route tests
├── services/       # Service layer tests
└── scripts/       # Script tests
```

#### E2E Tests Structure

```bash
.e2e/
├── ui/               # UI tests (split by component/page)
│   ├── button.spec.ts
│   ├── input.spec.ts
│   ├── sidebar.spec.ts
│   └── ...
├── api/              # API tests
│   ├── endpoints.spec.ts
│   ├── middlewares.spec.ts
│   └── redis-health.spec.ts  # Redis heartbeat E2E
├── mcp/              # MCP tests
│   ├── mcp.spec.ts
│   └── mcp-keys.spec.ts
├── middlewares/      # Middleware-specific tests
│   └── rate-limit.spec.ts
└── auth.spec.ts
```

#### Running Tests

```bash
# Run all unit tests
bun test

# Run all unit tests with preload
bun test:unit:preload

# Run specific test file
bun test test/config/docs.test.ts

# Run all E2E tests
bun run test:e2e

# Run specific E2E test file
bun run test:e2e -- .e2e/api/middlewares.spec.ts

# Run UI E2E tests only
bun run test:e2e -- .e2e/ui/
```

### Agent Behavior

When generating or modifying code, the AI agent must:

1. **Always add comments** - No uncommented code should be committed
2. **Refactor for clarity** - Add missing comments when modifying existing code
3. **Follow standards** - Strictly adhere to these coding guidelines
4. **Verify changes** - Run lint, fmt, and typecheck before finishing
5. **Security Scanning** - Be aware that Docker images are scanned by Trivy in CI. Ensure no vulnerable packages are introduced.
6. **Keep responses concise** - Answer directly without unnecessary preamble

---

## Quick Reference

All necessary information is in [README.md](./README.md), including:

- Commands (dev, build, lint, fmt, typecheck, etc.)
- Tech stack overview
- Project structure
- Code style guidelines (formatting, linting, TypeScript, naming, imports, React patterns, error handling, CSS, validation)
- Git workflow and pre-commit hooks
- Common issues

> Note: Find tech stack details here [Tech Stack](./README.md#tech-stack)

## Recommended Workflow

1. For any task, first check [PLAN.md](./knowledge/PLAN.md) to see if it's already planned
2. For non-trivial tasks, create a plan using PLAN.md template
3. Create/edit code
4. Run `bun run fmt` to ensure formatting
5. Run `bun run lint:fix` to auto-fix issues
6. Run `bun run typecheck` to verify types
7. Run `bun run fallow` to check for dead code, duplicates, and complexity issues
8. Run `bun test` to verify unit test
9. Run `bun run test:e2e` to verify E2E test
10. Once changes are complete, verify and update `PLAN.md` (mark completed tasks/goals)
11. Commit changes (hooks will verify)

## Environment Configuration

Database configuration is managed via environment variables:

```bash
# .env file
DATABASE_TYPE=sqlite
SQLITE_URL=file:.artifacts/tsse-elysia.db
BETTER_AUTH_SECRET=your-secret-key
GH_TOKEN=ghp_xxx  # For GitHub MCP integration
REDIS_URL=redis://localhost:6379  # Or rediss://...@....upstash.io:6379
```

### Key Variables

| Variable        | Default                          | Description                         |
| --------------- | -------------------------------- | ----------------------------------- |
| `DATABASE_TYPE` | `sqlite`                         | Database type (`sqlite`/`postgres`) |
| `SQLITE_URL`    | `file:.artifacts/tsse-elysia.db` | SQLite database URL                 |
| `PORT`          | `3000`                           | Server port                         |
| `HOST`          | `localhost`                      | Server host                         |
| `REDIS_URL`     | -                                | Redis connection URL                |
| `GH_TOKEN`      | -                                | GitHub token for MCP (optional)     |

## MCP Tools

This project includes MCP (Model Context Protocol) servers for enhanced capabilities:

| Tool         | Purpose                         | Requirement         |
| ------------ | ------------------------------- | ------------------- |
| `filesystem` | Enhanced file operations in src | Auto-configured     |
| `sqlite`     | Database queries                | Database must exist |

---

## Documentation & Preview

### Previewing Markdown Files

To preview markdown documentation before committing changes:

```bash
# Preview any markdown file with Bun (requires package.json to have dependencies)
bun ./path/to/file.md

# Example: Preview this guidelines file
bun ./AGENTS.md

# Example: Preview documentation
bun ./docs/guides/overview.md
```

This command uses Bun's built-in markdown rendering capabilities to display the content in your terminal, making it easy to verify formatting and content before committing.

---

## Release Process Guidelines

For AI agents, follow these guidelines when working with releases:

### Always Use Changesets

- **Never manually bump version numbers** in `package.json`
- Always use `bun changeset add` to create changesets
- This ensures proper versioning and CHANGELOG entries
- Changesets are required for any release

### Release Workflow

The automated release workflow (`.github/workflows/release.yml`) runs on push to `main`:

1. **Validation**: Checks working tree is clean, changesets exist
2. **Quality**: Lint, typecheck, tests
3. **Security**: Audit
4. **Build**: Application build
5. **Version**: Bump version, update CHANGELOG
6. **Tag**: Create git tag (e.g., `v1.2.0`)
7. **Release**: Create GitHub Release

### Manual Release

For manual releases, use the release script:

```bash
# Full release with all validations
bun run release

# Preview without making changes
bun run release --dry-run

# Skip quality checks (not recommended)
bun run release --skip-tests
```

### Versioning Rules

- Follow [SemVer](https://semver.org/) (MAJOR.MINOR.PATCH)
- Use changeset bump types:
  - `patch` for bug fixes
  - `minor` for new features (backward compatible)
  - `major` for breaking changes

---

### For Contributors

When making changes that should be released:

1. Create a changeset: `bun changeset add`
2. Select the package and bump type
3. Write a clear description
4. Commit with conventional commit message
5. Push - CI will handle the rest

### Documentation Updates

When releasing, always update documentation:

- Update `CHANGELOG.md` with release notes
- Update version references in docs if needed
- Ensure `CONTRIBUTING.md` reflects current process

---

## Review Checklist

Flag if:

- Code is overengineered
- Function `> 50` lines without reason
- Abstractions used only once
- Missing tests for logic changes
- Missing `JSDoc`
- Violates "surgical changes"
- Adds unused flexibility/config
- Doesn't match existing patterns

Always suggest simpler alternative if possible.