---
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