---
"tsse-elysia": minor
---

refactor: introduce service layer for business logic separation

Extract business logic from route handlers into dedicated service modules:

- `services/settings/`: User settings CRUD operations
- `services/llmo/`: LLMO schema.org transformations
- `services/mcp/`: MCP rate limiting and tool catalog
- `services/status/`: Historical status fetching

Routes now delegate to services, enabling better testability and reusability.