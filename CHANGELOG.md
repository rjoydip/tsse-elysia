---
title: Changelog
description: All notable changes to this project
---

## v0.0.5

[compare changes](https://github.com/rjoydip/tsse-elysia/compare/v0.0.4...v0.0.5)

## v0.0.4

[compare changes](https://github.com/rjoydip/tsse-elysia/compare/v0.0.3...v0.0.4)

## v0.0.3

### 🚀 Enhancements

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
- Run oxfmt before commit in release workflow ([#79](https://github.com/rjoydip/tsse-elysia/pull/79))

### 💅 Refactors

- Update project configuration and add new workflows ([#4](https://github.com/rjoydip/tsse-elysia/pull/4))
- Status monitoring, OpenAPI metadata, and API route organization ([#11](https://github.com/rjoydip/tsse-elysia/pull/11))
- Update logger to use Consola and add commands documentation ([#20](https://github.com/rjoydip/tsse-elysia/pull/20))
- Implement API layered architecture (HTTP → Controller → Service → Repository) ([#61](https://github.com/rjoydip/tsse-elysia/pull/61))
- Introduce reusable GitHub Actions components ([#68](https://github.com/rjoydip/tsse-elysia/pull/68))
- Add dependency injection to repositories and update docs to tanstack-form ([608e3e6](https://github.com/rjoydip/tsse-elysia/commit/608e3e6))

### 📖 Documentation

- Reorganize docs, add frontmatter support, fix E2E tests ([#6](https://github.com/rjoydip/tsse-elysia/pull/6))
- Update commands.md with all package.json scripts and fix DECISIONS.md reference ([#64](https://github.com/rjoydip/tsse-elysia/pull/64))

### 🏡 Chore

- Release v0.1.0 [skip ci] ([aad40fa](https://github.com/rjoydip/tsse-elysia/commit/aad40fa))
- Release v0.0.1 ([084b4c0](https://github.com/rjoydip/tsse-elysia/commit/084b4c0))
- Release v0.0.2 ([977d620](https://github.com/rjoydip/tsse-elysia/commit/977d620))

### ✅ Tests

- Add unit tests for PostgreSQL replica configuration ([#17](https://github.com/rjoydip/tsse-elysia/pull/17))

### 🤖 CI

- Ignored react doctor and commented out database migration ([#1](https://github.com/rjoydip/tsse-elysia/pull/1))
- Fix the workflow issue which introduced in previous PR ([#67](https://github.com/rjoydip/tsse-elysia/pull/67))

### ❤️ Contributors

- Joydip Roy ([@rjoydip](https://github.com/rjoydip))

## v0.0.0

### 🚀 Enhancements

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

### 📖 Documentation

- Reorganize docs, add frontmatter support, fix E2E tests ([#6](https://github.com/rjoydip/tsse-elysia/pull/6))
- Update commands.md with all package.json scripts and fix DECISIONS.md reference ([#64](https://github.com/rjoydip/tsse-elysia/pull/64))
- Add commands.md with all package.json scripts
- Add CODECOV_TOKEN to CI/CD secrets documentation
- Add Fallow MCP integration knowledge document
- Add DECISION 017 and 018 for GitHub Actions workflow changes
- Update folder structure and tech stack in documentation

### 🏡 Chore

- Release v0.1.0 [skip ci] ([aad40fa](https://github.com/rjoydip/tsse-elysia/commit/aad40fa))
- Release v0.0.1 ([084b4c0](https://github.com/rjoydip/tsse-elysia/commit/084b4c0))
- Add commitizen and standard-version for conventional commits
- Add versioning workflow with PR pre-release support

### ✅ Tests

- Add unit tests for PostgreSQL replica configuration ([#17](https://github.com/rjoydip/tsse-elysia/pull/17))

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

### ❤️ Contributors

- Joydip Roy ([@rjoydip](https://github.com/rjoydip))