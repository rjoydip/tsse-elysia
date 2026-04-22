---
title: TASKS.md
description: Execution-focused task tracker (source of truth for active work)
---

## 🔥 Current Sprint

> Only tasks that are actively being worked on.  
> Each task MUST map to a GitHub Issue.

### MCP (Phase 9)

- [ ] Rate limiting per API key <!-- issue: # -->
- [ ] Tool execution sandbox (timeout wrapper) <!-- issue: # -->
- [ ] MCP client SDK <!-- issue: # -->
- [ ] WebSocket transport support (optional) <!-- issue: # -->

### Data Strategy (Phase 10)

- [ ] Integrate pgvector <!-- issue: # -->
- [ ] Add Graph DB (Neo4j / Redis Graph) <!-- issue: # -->
- [ ] Setup pgBouncer <!-- issue: # -->
- [ ] Backup & restore <!-- issue: # -->

### Contract Testing (Phase 13)

- [ ] Setup Pact (consumer) <!-- issue: # -->
- [ ] Setup Pact (provider verification) <!-- issue: # -->
- [ ] CI integration <!-- issue: # -->
- [ ] Cover Auth + User APIs <!-- issue: # -->

### UI Expansion

- [x] Admin dashboard <!-- issue: #38 -->
- [ ] RBAC UI <!-- issue: # -->
- [ ] Organization management UI <!-- issue: # -->

---

## 📦 Completed (Compressed by Phase)

> Historical record (do not modify except append)

### Phase 0–2: Setup & Quality Gates

- [x] Project setup/cleanup scripts
- [x] CI/CD pipeline + release automation
- [x] Lint, format, typecheck, test pipelines
- [x] Security scanning (Trivy)
- [x] Decisions log enforcement workflow
- [x] Task synchronization workflow

### Phase 3: Auth & Security (Core)

- [x] Better Auth integration (server + client)
- [x] Email/password auth flows
- [x] Session management (view/revoke)
- [x] Profile & settings routes
- [x] Enhanced profile settings form with validation and state management
- [x] Unified settings store (TanStack Store) for all settings CRUD
- [x] User settings backend API with separate tables (Profile, Account, Display, Notifications)
- [x] Rate limiting + CORS + Helmet
- [x] Email verification (config-ready)
- [x] Social login (GitHub, Gmail) <!-- issue: #50 -->

### Phase 4: UI System (shadcn)

- [x] Full component library (Button, Card, Form, Table, etc.)
- [x] TanStack Form integration
- [x] Markdown renderer (Shiki)
- [x] UI unit + E2E test coverage

### Phase 7: Infra & DevOps

- [x] Docker + Docker Compose
- [x] Redis (cache, pub/sub, health checks)
- [x] CI security scanning

### Phase 8: Real-time

- [x] WebSocket/SSE infra
- [x] Authenticated connections
- [x] Rate limiting + heartbeat + reconnection
- [x] Real-time notifications & presence

### Phase 9: MCP Server (Core)

- [x] MCP server implementation
- [x] Tool schema + discovery
- [x] API key management
- [x] Rate limiting (basic)
- [x] MCP E2E + unit tests

### Phase 10: Database

- [x] PostgreSQL + SQLite strategy
- [x] Read replicas (round-robin)
- [x] Health checks
- [x] Migrations

### Testing & DX

- [x] Extensive unit tests (middlewares, config, UI)
- [x] E2E coverage (auth, UI, API, OpenAPI)
- [x] OpenAPI spec + Scalar UI tests

---

## 🧊 Backlog

> Not prioritized. Must be promoted to Current Sprint before work starts.

- [ ] Email system (Resend)
- [ ] Telemetry (APM + analytics)
- [ ] CDN + asset optimization
- [ ] Circuit breaker pattern
- [ ] API request coalescing

---

## 📏 Execution Rules

### Task Requirements

- Must be:
  - Small (≤ 1 PR)
  - Verifiable (clear output)
  - Independently completable

### Workflow

1. Add task here with `<!-- issue: # -->` placeholder.
2. Push to `main` or open a PR.
3. Automated workflow (`sync-tasks.yml`) creates GitHub Issue and updates placeholder with `#ID`.
4. Implement task.
5. Open PR (link issue).
6. Merge → move to Completed.

### WIP Limits

- Max 3 tasks in-progress at a time
- Do not start new tasks until one is completed

### Definition of Done (DoD)

A task is complete ONLY if:

- [ ] Code merged to main
- [ ] Tests added/updated
- [ ] CI passing
- [ ] Docs updated (if applicable)

---

## 🚫 Anti-Patterns

❌ Do NOT add:

- Vague tasks  
  → "Improve performance"

- Multi-scope tasks  
  → "Build full dashboard system"

- Hidden work  
  → Tasks without GitHub issue

✅ Good examples:

- "Add pgBouncer connection pooling"
- "Implement Redis-based rate limiter for API keys"