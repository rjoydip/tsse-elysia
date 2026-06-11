---
title: Changelog
description: All notable changes to this project
---

## v0.0.0

### 🚀 Enhancements

- Add Bruno API testing workspace with 8 API domain collections (auth, users, roles, settings, tasks, mcp, dashboard, system), local/CI environments, and CI workflow
- Add Bruno collection generation script from OpenAPI spec using `@usebruno/converters`
- Add Devkit developer toolkit (CLI + MCP) with database health, cache health, and system info commands
- Add production-aware seed script with `--prod` flag and graph seed data (monthly/weekly registration timestamps)
- Add full-page skeleton for role-based dashboard (replaces spinner during auth resolution)
- Add lazy getter pattern to all 4 settings repositories (prevents client-side crashes)
- Add `syncedSessionId` ref to deduplicate React StrictMode invocations in auth sync
- Add `--fresh`, `--count`, `--seed` CLI flags to seed script for better dev ergonomics

### 🩹 Fixes

- Fix dashboard crash on Vite HMR by guarding `initializeDatabase()` behind `globalThis` flags
- Fix dashboard "0" metrics by replacing direct `dashboardService` imports with `fetch()` calls (server-only modules no longer bundled client-side)
- Fix unhandled Elysia HTTP errors — all errors now return proper JSON response
- Fix role-based dashboard flash by deferring `authActions.setSession()` until after `/api/users/me` resolves
- Fix auth sync race condition exposed by React StrictMode double-invocation
- Fix cache storage re-initialization on HMR by persisting reference on `globalThis`
- Fix `usePermission.isPending` to return `true` when auth store lags behind session
- Fix client bundle including `pg`/`drizzle-orm/node-postgres` by making them dynamic imports
- Fix seed script env type errors (`SQLITE_URL`, `SQLITE_AUTH_TOKEN` type casting)

### 💅 Refactors

- Rename `ADMIN_CREDENTIALS` to `ESSENTIAL_USERS`/`DEV_USERS` in seed script for clarity
- Rewrite 5 dashboard hooks to use `fetch()` instead of server-side service imports

- Add user create/edit dialog with password validation and matching indicator
- Add password strength requirements indicator (8 chars, lowercase, number)
- Improve username generation from name (handles special characters)
- Add unit tests for user form schemas (20 tests)
- Add E2E tests for users dashboard and add user dialog
- Add sign-up password match indicator
- Improve form error handling in TanStack Form integration
- Auth service and changes in other places ([#2](https://github.com/rjoydip/tsse-elysia/pull/2))
- Add dead code detection with TypeScript and oxlint rules ([#3](https://github.com/rjoydip/tsse-elysia/pull/3))
- Implement user account management with auth pages and UI components ([#8](https://github.com/rjoydip/tsse-elysia/pull/8))
- Add user preferences management and UI improvements ([#9](https://github.com/rjoydip/tsse-elysia/pull/9))
- Add MCP server APIs and stabilize E2E coverage ([#10](https://github.com/rjoydip/tsse-elysia/pull/10))
- Implement Redis integration with rate limiting, authentication, and documentation infrastructure ([#13](https://github.com/rjoydip/tsse-elysia/pull/13))
- Implement LLM Optimization (LLMO) features ([#22](https://github.com/rjoydip/tsse-elysia/pull/22))
- Enhance status page with cache infrastructure and latency graph ([#24](https://github.com/rjoydip/tsse-elysia/pull/24))
- Enhance GitHub Actions with decisions log enforcement and task syncing ([#25](https://github.com/rjoydip/tsse-elysia/pull/25))
- Implement user profile details display ([#42](https://github.com/rjoydip/tsse-elysia/pull/42))
- Add versioning workflow with PR pre-release support ([#69](https://github.com/rjoydip/tsse-elysia/pull/69))
- Add versioning workflow with PR pre-release support ([f8f291b](https://github.com/rjoydip/tsse-elysia/commit/f8f291b))
- Add users management with dashboard and API ([#72](https://github.com/rjoydip/tsse-elysia/pull/72))
- Implement API layered architecture (HTTP → Controller → Service → Repository) ([#61](https://github.com/rjoydip/tsse-elysia/pull/61))
- Add Fallow health badge with CI automation
- Add /api/meta endpoint and display version in footer
- Add fallow configuration and update development workflow
- Add commitizen for guided conventional commits

### 🩹 Fixes

- React doctor scan warning ([ab2da46](https://github.com/rjoydip/tsse-elysia/commit/ab2da46))
- Resolve auth store hook issues and update dependencies ([#19](https://github.com/rjoydip/tsse-elysia/pull/19))
- Resolve SSR hydration errors and update auth store tests ([#26](https://github.com/rjoydip/tsse-elysia/pull/26))
- **ci:** Prevent duplicate issue creation in sync-tasks workflow ([#60](https://github.com/rjoydip/tsse-elysia/pull/60))
- Use correct version tag for changelogithub action ([c2d86b7](https://github.com/rjoydip/tsse-elysia/commit/c2d86b7))
- Update CI and release workflows to use PR triggers and add database env vars ([#71](https://github.com/rjoydip/tsse-elysia/pull/71))
- Automate CHANGELOG and version bump on PR merge to main ([#73](https://github.com/rjoydip/tsse-elysia/pull/73))
- Remove pull_request.merged condition for release tag creation ([#77](https://github.com/rjoydip/tsse-elysia/pull/77))
- Remove --force-if-needed from tag push in CI workflow ([#78](https://github.com/rjoydip/tsse-elysia/pull/78))
- Fix the workflow issue which introduced in previous PR ([#67](https://github.com/rjoydip/tsse-elysia/pull/67))
- Add id prop to Input component for label association
- Resolve circular dependencies, duplicate exports, and TypeScript errors
- Resolve duplicate ChangelogEntry export between features and services
- Resolve codeql/upload-sarif category conflict in fallow workflow

### 💅 Refactors

- Update project configuration and add new workflows ([#4](https://github.com/rjoydip/tsse-elysia/pull/4))
- Status monitoring, OpenAPI metadata, and API route organization ([#11](https://github.com/rjoydip/tsse-elysia/pull/11))
- Update logger to use Consola and add commands documentation ([#20](https://github.com/rjoydip/tsse-elysia/pull/20))
- Implement API layered architecture (HTTP → Controller → Service → Repository) ([#61](https://github.com/rjoydip/tsse-elysia/pull/61))
- Introduce reusable GitHub Actions components ([#68](https://github.com/rjoydip/tsse-elysia/pull/68))
- Add dependency injection to repositories and update docs to tanstack-form ([608e3e6](https://github.com/rjoydip/tsse-elysia/commit/608e3e6))
- Extract shared components and utilities to reduce code duplication
- Split monolithic schema into modular files
- Reorganize lib directory structure
- Move business logic to services layer
- Move Devkit and Bruno type declarations from `src/` to `tools/` directory

### 📖 Documentation

- Reorganize docs, add frontmatter support, fix E2E tests ([#6](https://github.com/rjoydip/tsse-elysia/pull/6))
- Update commands.md with all package.json scripts and fix DECISIONS.md reference ([#64](https://github.com/rjoydip/tsse-elysia/pull/64))
- Add commands.md with all package.json scripts
- Add CODECOV_TOKEN to CI/CD secrets documentation
- Add Fallow MCP integration knowledge document
- Add DECISION 017 and 018 for GitHub Actions workflow changes
- Update folder structure and tech stack in documentation
- Add Devkit CLI/MCP usage reference to AGENTS.md
- Add Phase 25 (Bruno + Devkit integration) to PLANS.md

### 🏡 Chore

- Release v0.1.0 [skip ci] ([aad40fa](https://github.com/rjoydip/tsse-elysia/commit/aad40fa))
- Release v0.0.1 ([084b4c0](https://github.com/rjoydip/tsse-elysia/commit/084b4c0))
- Add commitizen and standard-version for conventional commits
- Add versioning workflow with PR pre-release support

### ✅ Tests

- Add unit tests for dashboard tabs component
- Add E2E tests for dashboard tabs functionality
- Add unit tests for PostgreSQL replica configuration ([#17](https://github.com/rjoydip/tsse-elysia/pull/17))
- Add unit tests for Devkit RPC definitions and Bruno collection structure (21 tests)

### 🏗️ Infrastructure

- Implement PostgreSQL replica configuration with round-robin read distribution
- Add Trivy container security scanning to CI
- Add Docker build with multi-stage builds for production
- Add E2E test infrastructure with dynamic database adapter

### 🤖 CI

- Ignored react doctor and commented out database migration ([#1](https://github.com/rjoydip/tsse-elysia/pull/1))
- Fix the workflow issue which introduced in previous PR ([#67](https://github.com/rjoydip/tsse-elysia/pull/67))
- Add fallow analysis workflow for GitHub Actions
- Add decisions-check.yml for architecture enforcement
- Add sync-tasks.yml for task-to-issue automation
- Add pr-review.yml for automated PR reviews
- Add issue-triage.yml for automated issue triage
- Add docker-scan job for container security
- Add Bruno API smoke test workflow (`bruno-api.yml`)

### ❤️ Contributors

- Joydip Roy ([@rjoydip](https://github.com/rjoydip))