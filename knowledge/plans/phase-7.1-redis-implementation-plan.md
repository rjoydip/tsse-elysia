# Phase 7.1: Redis & Cache Implementation Plan (Unstorage-backed)

## Overview

Implement a unified cache and storage layer using **Unstorage** with multiple backend support. This enables high-performance caching and Pub/Sub capabilities (via Bun native Redis) while providing fallback mechanisms for different environments.

## Architecture

```mermaid
graph TD
A["Application Code"] --> B["src/services/cache/index.ts<br/>Cache Layer"]

    A --> C["src/services/cache/pubsub.ts<br/>Pub/Sub helpers"]

    B --> D["src/services/cache/index.ts<br/>Unstorage Backend"]
    D --> E{REDIS_URL env var}
    E -->|Set| F["Redis Backend<br/>(Cache + Pub/Sub)"]
    E -->|Not Set| G{DATABASE_TYPE env var}
    G -->|postgres| H["PostgreSQL Backend<br/>(Cache only)"]
    G -->|sqlite/other| I["LRU Memory Backend<br/>(Cache only)"]
```

## File Changes Summary

| File                               | Action     | Purpose                                                      |
| ---------------------------------- | ---------- | ------------------------------------------------------------ |
| `src/services/cache/index.ts`           | **Create** | Unstorage driver configuration (Redis/Postgres/LRU)          |
| `src/services/cache/pubsub.ts`          | **Create** | Pub/Sub implementation (requires Redis backend) |
| `src/services/cache/index.ts`          | **Create** | High-level cache API (get/set/delete/clear)                  |
| `src/routes/api/modules/-redis.ts` | **Create** | Health check and status monitoring for storage               |
| `test/lib/redis/redis.test.ts`     | **Create** | Unit tests for storage backends                              |
| `test/lib/redis/pubsub.test.ts`    | **Create** | Unit tests for Pub/Sub functionality                         |
| `.e2e/api/cache.spec.ts`           | **Create** | E2E test for storage health monitoring                       |

## Implementation Details

### 1. Unified Storage (`src/services/cache/index.ts`)

### 2. Pub/Sub (`src/services/cache/pubsub.ts`)

### 3. Cache API (`src/services/cache/index.ts`)

Provides a simplified interface for application-wide caching:

- Standard `get`, `set`, `removeItem` methods.
- Namespace support for avoiding collisions.
- Built-in TTL support (where supported by backend).

## Verification Plan

### Automated Tests

- **Unit**: Verify driver selection logic and basic CRUD operations.
- **Pub/Sub**: Test message delivery across channels (requires Redis).
- **E2E**: Check health status reporting in the monitoring dashboard.

### Manual Verification

- Verify Redis connection in Docker environment.
- Check logs for proper backend initialization.

## Status: COMPLETED

All tasks in this phase have been implemented and verified.