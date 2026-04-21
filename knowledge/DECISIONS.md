# DECISIONS.md

## Purpose

Track important architectural and technical decisions.

Each decision must answer:

- Why this approach?
- What alternatives were considered?
- What are the tradeoffs?

---

## Decision Log

---

### 001: Use Bun as Runtime

**Status:** Accepted

**Why:**

- Faster install + execution
- Native TS support
- Simplified tooling

**Tradeoffs:**

- Smaller ecosystem vs Node.js
- Potential compatibility issues

---

### 002: Multi-Database Strategy

**Status:** Accepted

**Approach:**

- SQLite → Development
- PostgreSQL → Production
- Cache (Redis/Postgres/LRU) → Cache + Pub/Sub

**Why:**

- Environment flexibility
- Performance optimization

**Tradeoffs:**

- Increased complexity
- Operational overhead

---

### 003: Use Unstorage for Storage Layer

**Status:** Accepted

**Why:**

- Unified abstraction
- Multi-backend support

**Tradeoffs:**

- Abstraction overhead
- Debugging complexity

---

### 004: MCP as External API Layer

**Status:** Accepted

**Why:**

- Standardized AI integration
- Tool-based extensibility

**Tradeoffs:**

- Additional infra complexity
- Security considerations

---

### 005: WebSockets for Real-time

**Status:** Accepted

**Why:**

- Low latency updates
- Presence + notifications

**Tradeoffs:**

- Stateful connections
- Scaling complexity

---

### 006: Cache as Core Infra Component

**Status:** Accepted

**Used for:**

- Cache (multi-backend: Redis, PostgreSQL, LRU)
- Pub/Sub (Redis only)
- Rate limiting
- Sessions

**Why:**

- Unified storage abstraction via Unstorage
- Multiple backends for flexibility (Redis/Postgres/LRU)
- Fallback to LRU for local development

**Tradeoffs:**

- External dependency (when using Redis)
- Operational cost (Redis)

---

### 007: GitHub Actions Workflows for Decision Enforcement

**Status:** Accepted

**Why:**

- Enforce DECISIONS.md updates when architecture changes
- Automate GitHub Issues from TASKS.md task tracking
- Improve developer experience with workflow automation

**Components:**

- `decisions-check.yml`: Fails PR if architecture files change but DECISIONS.md not updated
- `sync-tasks.yml`: Creates GitHub Issues from tasks without issue numbers
- `new-decision.ts`: CLI to create new decision entries
- `sync-tasks.ts`: Script to extract tasks needing issues

**Tradeoffs:**

- Additional workflow maintenance
- Complexity in workflow configuration

---

## Rules

- Every major decision MUST be logged
- Do NOT log trivial choices
- Keep entries short but meaningful

---

## When to Add a Decision

Add when:

- Introducing new infrastructure
- Changing architecture
- Replacing core library
- Adding new protocol/system (e.g., MCP)

Do NOT add when:

- Fixing bugs
- Refactoring code
- Minor optimizations