---

## 0.1.0
### Minor Changes



- [#61](https://github.com/rjoydip/tsse-elysia/pull/61) [`2e851b0`](https://github.com/rjoydip/tsse-elysia/commit/2e851b046667c739e0d7c475af2002889ac33633) Thanks [@rjoydip](https://github.com/rjoydip)! - refactor: introduce service layer for business logic separation
  
  Extract business logic from route handlers into dedicated service modules:
  
  - `services/settings/`: User settings CRUD operations
  - `services/llmo/`: LLMO schema.org transformations
  - `services/mcp/`: MCP rate limiting and tool catalog
  - `services/status/`: Historical status fetching
  
  Routes now delegate to services, enabling better testability and reusability.

### Patch Changes



- [#9](https://github.com/rjoydip/tsse-elysia/pull/9) [`d7be727`](https://github.com/rjoydip/tsse-elysia/commit/d7be7279ed2e1fd3277438a2c1d0e3dabca8ee0f) Thanks [@rjoydip](https://github.com/rjoydip)! - Fix docs E2E tests, add frontmatter to docs, and add unit/E2E tests
  
  - Fix sidebar locator in docs E2E tests (use data-sidebar attribute instead of aside)
  - Add frontmatter (title, description) to all markdown docs
  - Add unit tests for new UI components (avatar, breadcrumb, collapsible, dropdown-menu, select, sheet, table, tooltip)
  - Add unit tests for useIsMobile hook logic
  - Add E2E tests for mobile behavior
title: Changelog
description: All notable changes to this project
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- User profile details display
- Status page with cache infrastructure and latency graph
- Evlog integration for structured logging (FS and OTLP adapters)
- Unstorage-based Pub/Sub system with multi-backend support
- Comprehensive Tools Reference documentation
- Service layer for business logic separation

### Changed

- Refactored logger to use Evlog for unified client/server logging
- Updated Project Structure to organize library modules more effectively
- Migrated Pub/Sub from Bun native RedisClient to Unstorage event system
- Fixed import paths and folder structure organization
- Fixed SSR hydration errors in auth store tests

### Fixed

- Resolve SSR hydration errors and update auth store tests
- Backup integration test and db seed for Windows stability
- Auth store hook issues and updated dependencies
- GitHub Actions workflow issue for duplicate task creation

## [0.0.0] - 2026-03-25

### Added

- Initial release
