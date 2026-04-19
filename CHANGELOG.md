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

- Evlog integration for structured logging (FS and OTLP adapters)
- Unstorage-based Pub/Sub system with multi-backend support
- Comprehensive Tools Reference documentation

### Changed

- Refactored logger to use Evlog for unified client/server logging
- Updated Project Structure to organize library modules more effectively
- Migrated Pub/Sub from Bun native RedisClient to Unstorage event system

## [0.0.0] - 2026-03-25

### Added

- Initial release