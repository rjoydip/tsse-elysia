# Package Scripts

This document lists all available npm scripts in `package.json`.

## Table of Contents

- [Development](#development)
- [Testing](#testing)
- [Database](#database)
- [Linting & Formatting](#linting--formatting)
- [Build & Release](#build--release)
- [Utilities](#utilities)
- [Script Utilities](#script-utilities)
- [API Testing](#api-testing)

---

## Development

| Script              | Command                           | Description                                   |
| ------------------- | --------------------------------- | --------------------------------------------- |
| `dev`               | `bun --bun vite dev`              | Start Vite development server with hot reload |
| `build`             | `bun --bun vite build`            | Build the application for production          |
| `preview`           | `bun --bun vite preview`          | Preview production build locally              |
| `frameless:preview` | `bunx broz http://localhost:3000` | Preview without terminal UI                   |
| `routes:generate`   | `tsr generate`                    | Generate TypeScript routes                    |

---

## Testing

| Script             | Command                          | Description                      |
| ------------------ | -------------------------------- | -------------------------------- |
| `test`             | `bun test`                       | Run all tests                    |
| `test:watch`       | `bun test --watch`               | Run tests in watch mode          |
| `test:coverage`    | `bun test --coverage`            | Run tests with coverage report   |
| `test:e2e`         | `playwright test`                | Run end-to-end tests             |
| `test:e2e:ui`      | `bun playwright test --ui`       | Run E2E tests with Playwright UI |
| `test:e2e:headed`  | `bun playwright test --headed`   | Run E2E tests in headed mode     |
| `test:e2e:report`  | `bun playwright show-report`     | Show Playwright test report      |
| `test:load`        | `bunx k6 run .k6/smoke-test.js`  | Run load smoke test              |
| `test:load:api`    | `bunx k6 run .k6/api-test.js`    | Run API load test                |
| `test:load:stress` | `bunx k6 run .k6/stress-test.js` | Run stress test                  |

---

## Database

| Script          | Command                                   | Description                   |
| --------------- | ----------------------------------------- | ----------------------------- |
| `db:generate`   | `drizzle-kit generate`                    | Generate Drizzle migrations   |
| `db:migrate`    | `bun run ./scripts/db-migrate.ts`         | Run database migrations       |
| `db:push`       | `drizzle-kit push`                        | Push schema to database       |
| `db:studio`     | `drizzle-kit studio`                      | Open Drizzle Studio           |
| `db:seed`       | `bun run ./scripts/db-seed.ts`            | Seed the database             |
| `db:seed:fresh` | `bun run db:seed --fresh`                 | Reset and reseed              |
| `db:seed:prod`  | `bun run db:seed --prod`                  | Seed production (admins only) |
| `db:setup`      | `bun run db:migrate && bun run db:seed`   | Full database setup           |
| `db:reset`      | `bun run db:remove && bun run db:migrate` | Reset database                |
| `db:remove`     | `bun run ./scripts/remove-db.ts`          | Remove database               |

**Seed Script Options:**

| Flag        | Default    | Description                                  |
| ----------- | ---------- | -------------------------------------------- |
| `--fresh`   | `false`    | Reset database tables before seeding         |
| `--prod`    | `false`    | Production mode (admins only, no fake users) |
| `--count=N` | `100`      | Number of fake users (dev mode only)         |
| `--seed=N`  | `20260409` | Faker seed for deterministic output          |

---

## Linting & Formatting

| Script          | Command                                                                             | Description              |
| --------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| `format`        | `oxfmt .`                                                                           | Format code              |
| `format:check`  | `oxfmt --check .`                                                                   | Check code formatting    |
| `lint`          | `oxlint . --format=github`                                                          | Lint code                |
| `lint:ci`       | `bun run format:check && bun run lint`                                              | CI linting pipeline      |
| `lint:check`    | `bun run format:check && bun run lint && bun run fallow:dead && bun run actions-up` | Local linting process    |
| `lint:fix`      | `oxlint . --fix && oxfmt .`                                                         | Auto-fix linting issues  |
| `typecheck`     | `tsc --noEmit`                                                                      | Type check TypeScript    |
| `react:doctor`  | `react-doctor . -y`                                                                 | Run React Doctor         |
| `fallow`        | `fallow`                                                                            | Check for code issues    |
| `fallow:dead`   | `fallow dead-code`                                                                  | Check for dead code      |
| `fallow:dupes`  | `fallow dupes`                                                                      | Check for duplicate code |
| `fallow:health` | `fallow health`                                                                     | Check code health        |
| `fallow:fix`    | `fallow fix --dry-run`                                                              | Auto-fix code issues     |
| `actions-up`    | `actions-up`                                                                        | Update GitHub Actions    |

---

## Build & Release

| Script      | Command                            | Description             |
| ----------- | ---------------------------------- | ----------------------- |
| `setup`     | `bun run script:setup`             | Initial project setup   |
| `cleanup`   | `bun run script:cleanup`           | Clean up artifacts      |
| `changelog` | `changelogen`                      | Generate changelog      |
| `version`   | `changelogen --bump`               | Bump version            |
| `start`     | `node ./dist/server/server.js`     | Start production server |
| `security`  | `bun audit --audit-level=critical` | Security audit          |

---

## Utilities

| Script             | Command                                       | Description                 |
| ------------------ | --------------------------------------------- | --------------------------- |
| `proxy:start`      | `bun --run portless proxy start --https`      | Start HTTPS proxy           |
| `proxy:foreground` | `bun --run portless proxy start --foreground` | Start proxy in foreground   |
| `proxy:stop`       | `bun --run portless proxy stop --https`       | Stop HTTPS proxy            |
| `postinstall`      | `bunx playwright install`                     | Install Playwright browsers |
| `prepare`          | `simple-git-hooks`                            | Set up git hooks            |

---

## Script Utilities

| Script                          | Command                                           | Description                |
| ------------------------------- | ------------------------------------------------- | -------------------------- |
| `script:setup`                  | `bun run ./scripts/setup.ts`                      | Run setup script           |
| `script:cleanup`                | `bun run ./scripts/cleanup.ts`                    | Run cleanup script         |
| `script:patch:server`           | `bun run ./scripts/patch-server.ts`               | Patch server script        |
| `script:decision:new`           | `bun scripts/new-decision.ts`                     | Create new decision record |
| `script:check-db`               | `bun run ./scripts/check-db.ts`                   | Check database status      |
| `script:fix-migrations`         | `bun run ./scripts/fix-migrations.ts`             | Fix database migrations    |
| `script:opencode-session-clear` | `bun run ./scripts/opencode-session-clear.ts`     | Clear Opencode sessions    |
| `script:release`                | `bun run ./scripts/release.ts`                    | Run release script         |
| `script:sync-tasks`             | `bun run ./scripts/sync-tasks.ts`                 | Sync tasks                 |
| `script:task-config`            | `bun run ./scripts/task-config.ts`                | Configure tasks            |
| `script:generate-bruno`         | `bun run ./scripts/generate-bruno-collections.ts` | Generate Bruno collections |

---

## API Testing

| Script        | Command                                                                                                 | Description                 |
| ------------- | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| `bruno:run`   | `cd .bruno/collections && npx @usebruno/cli run . --env-file ../environments/local.yml -r`              | Run all Bruno API tests     |
| `bruno:smoke` | `cd .bruno/collections && npx @usebruno/cli run . --env-file ../environments/local.yml --tags smoke -r` | Run Bruno smoke tests       |
| `bruno:ci`    | `cd .bruno/collections && npx @usebruno/cli run . --env-file ../environments/ci.yml --tags smoke -r`    | Run Bruno smoke tests in CI |

---

## Development Pipeline

Typical development workflow:

```bash
# Start development
bun run dev

# Run tests during development
bun test

# Before committing
bun run lint:fix
bun run typecheck

# Build and verify
bun run build
bun run preview
```

---

## Notes

- Most scripts use `bun` as the runtime
- E2E tests require the dev server to be running (or use `preview`)
- `db:migrate` auto-detects PGlite vs. real PostgreSQL — see `scripts/db-migrate.ts`
- Database scripts assume `POSTGRES_URL` or PGlite (in-memory) is configured
- Load tests use `bunx k6` (runs k6 via bunx)
- Lifecycle scripts like `postinstall` and `prepare` run automatically