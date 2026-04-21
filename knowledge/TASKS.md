# TASKS.md

## Current Sprint Focus

### MCP (Phase 9)

- [ ] Implement rate limiting per API key
- [ ] Add tool execution sandbox (timeout wrapper)
- [ ] Build MCP client SDK
- [ ] Add WebSocket transport support (optional)

---

### Data Strategy (Phase 10)

- [ ] Integrate pgvector
- [ ] Add Graph DB support (Neo4j / Redis Graph)
- [ ] Setup pgBouncer (connection pooling)
- [ ] Implement backup & restore

---

### Contract Testing (Phase 13)

- [ ] Setup Pact (consumer)
- [ ] Setup Pact (provider verification)
- [ ] Add CI integration
- [ ] Cover Auth + User APIs

---

### UI Expansion

- [ ] Admin dashboard
- [ ] RBAC UI
- [ ] Organization management UI

---

## Backlog (Not Immediate)

- [ ] Email system (Resend)
- [ ] Telemetry (APM + analytics)
- [ ] CDN + asset optimization
- [ ] Circuit breaker pattern
- [ ] API request coalescing

---

## Rules

- Tasks must be:
  - Small
  - Verifiable
  - Independently completable

- When done:
  - Move to PR
  - Update phase plan if needed
  - Remove from TASKS.md

---

## Anti-Patterns

Do NOT add:

- Long descriptions
- Implementation details
- Multi-day vague tasks

Bad:
❌ "Improve system performance"

Good:
✅ "Add pgBouncer connection pooling"