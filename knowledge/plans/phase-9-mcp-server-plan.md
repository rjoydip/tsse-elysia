# Phase 9: MCP Server (External Integration) - Detailed Implementation Plan

## Overview

Implement a Model Context Protocol (MCP) server to expose application functionality as AI-callable tools. This enables external AI agents (e.g., Claude Desktop, other MCP clients) to interact with the application through standardized tool calls.

## Architecture

- **Deployment**: Embedded in main application (not standalone microservice)
- **Transport**: Streamable HTTP (primary) for remote clients
- **Authentication**: API key-based via better-auth integration
- **Organization**: Uses better-auth organization plugin for multi-tenant scoping

---

## Prerequisites & Dependencies

### Install Required Packages

```bash
bun add @modelcontextprotocol/server @modelcontextprotocol/sdk zod
```

### Add Organization Plugin

```bash
bun add @better-auth/plugins
```

### Review Existing Code

- Existing rate limiting: `src/middlewares/rate-limit.ts`
- Auth configuration: `src/lib/auth/index.ts`
- Database schema: `src/schema/core.ts`

---

## Step 1: Database Schema & API Key Management

### 1.1 Add MCP API Key Table to Schema

**File**: `src/schema/core.ts`

Add new table `mcpApiKeys` with fields:

- `id`: Primary key (UUID)
- `keyHash`: Hashed API key for storage security
- `name`: User-friendly name for the key
- `userId`: Owner user reference
- `organizationId`: Optional org scope (null for user-scoped keys)
- `permissions`: JSON object for tool permissions
- `rateLimit`: Max requests per window
- `rateLimitDuration`: Window duration in ms
- `lastUsedAt`: Timestamp of last usage
- `expiresAt`: Optional expiration date
- `createdAt`, `updatedAt`: Timestamps

### 1.2 API Key Management Routes

**File**: `src/routes/api/mcp/keys.ts`

Endpoints:

- `POST /api/mcp/keys` - Create new API key
- `GET /api/mcp/keys` - List user's API keys
- `DELETE /api/mcp/keys/:id` - Revoke API key
- `PUT /api/mcp/keys/:id` - Update key (name, permissions)

### 1.3 API Key Service

**File**: `src/lib/mcp/api-keys.ts`

Functions:

- `generateApiKey()`: Generate cryptographically secure key (32+ chars)
- `hashKey(key: string)`: Hash key using blake3/argon2 for storage
- `verifyKey(key: string)`: Validate and lookup key
- `createApiKey(data)`: Create new key with permissions
- `revokeApiKey(id)`: Mark key as revoked
- `getApiKeyById(id)`: Retrieve key metadata (not the raw key)

---

## Step 2: MCP Server Core

### 2.1 MCP Server Instance

**File**: `src/lib/mcp/server.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { randomUUID } from "uncrypto";

const server = new McpServer(
  {
    name: "tsse-elysia",
    version: "1.0.0",
  },
  {
    instructions: "Tools for managing users, organizations, and authentication.",
    capabilities: {
      tools: {},
      resources: {},
      logging: {},
    },
  },
);
```

### 2.2 Transport Setup

**File**: `src/lib/mcp/transport.ts`

- Configure `NodeStreamableHTTPServerTransport`
- Set up session management with API key auth
- Enable DNS rebinding protection
- Handle session lifecycle (connect/disconnect)

### 2.3 Request Handler

**File**: `src/lib/mcp/handler.ts`

- Validate incoming MCP requests
- Extract and validate API key from headers
- Apply rate limiting per API key
- Route to appropriate tool handler
- Format responses

---

## Step 3: Tool Schema Design

### 3.1 Tool Categories

| Category         | Tools                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**         | `get-current-user`, `list-sessions`, `revoke-session`                                                                          |
| **Users**        | `get-user`, `list-users`, `update-user`                                                                                        |
| **Organization** | `get-organization`, `list-members`, `add-member`, `remove-member`, `update-role`, `invite-member`, `list-teams`, `create-team` |
| **Custom**       | Extend based on app capabilities                                                                                               |

### 3.2 Tool Definition Pattern

**File**: `src/lib/mcp/tools/index.ts`

```typescript
import { z } from "zod";

server.registerTool(
  "get-current-user",
  {
    title: "Get Current User",
    description: "Get the authenticated user details",
    inputSchema: z.object({}),
    outputSchema: z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string(),
      image: z.string().optional(),
    }),
  },
  async ({}, ctx) => {
    // Implementation
  },
);
```

### 3.3 Tool Annotations

Use annotations for client UI hints:

- `readOnlyHint`: Boolean - read-only operation
- `destructiveHint`: Boolean - modifies data
- `idempotentHint`: Boolean - safe to retry

---

## Step 4: Authentication & Authorization

### 4.1 MCP Authentication Layer

**File**: `src/lib/mcp/auth.ts`

- Extract `Authorization: Bearer <key>` header
- Validate key against database
- Map key to user session
- Handle token refresh
- Reject invalid/expired keys

### 4.2 Organization-Scoped Access Control

**File**: `src/lib/mcp/scopes.ts`

- Filter tools by organization membership
- Scope data queries to user's organization
- Validate member has required role for actions
- Handle org switching within session

### 4.3 Permission System

- Map organization roles (owner, admin, member) to tool permissions
- Allow custom permission overrides per API key
- Check permissions before tool execution

---

## Step 5: Rate Limiting & Quotas

### 5.1 MCP-Specific Rate Limiter

**File**: `src/lib/mcp/rate-limit.ts`

Implement token bucket algorithm:

- Per-API-key limits (default: 100 req/min)
- Per-organization aggregate limits
- Tool-specific limits (heavy tools: 10 req/min)
- Configurable via subscription plans

### 5.2 Rate Limit Headers

Add to responses:

- `X-RateLimit-Limit`: Max requests
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Window reset time

### 5.3 Quota Tracking

**File**: `src/lib/mcp/quota.ts`

- Track daily/monthly request counts
- Monitor bandwidth usage
- Enforce tool execution time limits
- Store quota data in database

---

## Step 6: Security & Sandboxing

### 6.1 Tool Execution Sandbox

**File**: `src/lib/mcp/sandbox.ts`

- Execution timeout per tool (default: 30 seconds)
- Memory usage monitoring
- CPU time limits
- Error boundary with graceful failure
- Prevent infinite loops in tool handlers

### 6.2 Request Validation

- Input sanitization for all tool inputs
- SQL injection prevention (parameterized queries)
- Path traversal protection for file-related tools
- XSS prevention in returned data

### 6.3 Audit Logging

**File**: `src/lib/mcp/audit.ts`

Log all MCP operations:

- Timestamp, API key ID, user ID
- Tool name, input params (sanitized)
- Response status, execution time
- Store in database for compliance

---

## Step 7: Monitoring & Health

### 7.1 Connection Health Service

**File**: `src/lib/mcp/health.ts`

- Track active MCP connections
- Heartbeat mechanism (ping/pong)
- Connection timeout (default: 5 min idle)
- Auto-cleanup stale sessions

### 7.2 Health Check Endpoint

**Endpoint**: `GET /api/mcp/health`

```json
{
  "status": "healthy",
  "activeConnections": 42,
  "requestsPerMinute": 150,
  "errorRate": 0.02,
  "uptime": "24h30m"
}
```

### 7.3 Metrics Collection

**File**: `src/lib/mcp/metrics.ts`

- Request latency histograms (p50, p95, p99)
- Tool usage counts and rankings
- Error rate by tool
- API key usage aggregation
- Export to Prometheus/StatsD (optional)

---

## Step 8: Tool Discovery & Documentation

### 8.1 Tool Discovery Endpoint

**Endpoint**: `GET /api/mcp/tools`

```json
{
  "tools": [
    {
      "name": "get-current-user",
      "title": "Get Current User",
      "description": "Get the authenticated user details",
      "inputSchema": { ... },
      "outputSchema": { ... },
      "category": "auth"
    }
  ]
}
```

### 8.2 MCP Manifest Endpoint

**Endpoint**: `GET /api/mcp/manifest.json`

- Server capabilities
- Tool definitions with full schemas
- Resource templates
- Prompt templates
- Protocol version

### 8.3 OpenAPI Specification

Generate OpenAPI 3.0 spec for MCP tools to enable:

- Client code generation
- API documentation
- Postman/Insomnia integration

---

## Step 9: Client SDK

### 9.1 TypeScript Client SDK

**File**: `src/lib/mcp/client/index.ts`

```typescript
import { createMcpClient } from "@modelcontextprotocol/sdk/client";

const client = createMcpClient({
  serverUrl: "https://api.example.com/mcp",
  apiKey: "mcp_xxx",
});

// Type-safe tool calls
const user = await client.callTool("get-current-user", {});
const members = await client.callTool("list-members", {
  organizationId: "org_123",
});
```

Features:

- Type-safe tool invocation
- Automatic retry with backoff
- Connection pooling
- Request/response interceptors

### 9.2 SDK Documentation

**Location**: `docs/mcp/`

- Quick start guide
- Authentication setup
- Tool reference
- Examples
- Troubleshooting

---

## Step 10: Advanced Features (Future)

### 10.1 WebSocket Transport

- Real-time tool streaming
- Progress notifications
- Long-running task support

### 10.2 Load Balancing

- Redis session store
- Sticky sessions
- Distributed rate limiting

### 10.3 Response Caching

**File**: `src/lib/mcp/cache.ts`

- Cache GET tool results (TTL: 60s)
- Invalidate on mutations
- Redis-backed for multi-instance

---

## Step 11: Telemetry & Analytics

### 11.1 Usage Tracking

**File**: `src/lib/mcp/telemetry.ts`

Track per-organization and per-API-key:

- Tool invocation counts
- Data volume (bytes)
- API call patterns
- Cost attribution

---

## Implementation Status

### Completed Features (✅)

- MCP protocol server with Streamable HTTP transport
- Tool schemas for auth, users, organizations
- API key authentication (Bearer tokens)
- Organization-scoped tool access
- Health monitoring endpoint (`GET /api/mcp/health`)
- Tool discovery endpoint (`GET /api/mcp/tools`)
- API key CRUD routes (`/api/mcp/keys`)
- Database schema with migrations
- Session management

### Remaining Items (🔲)

| Item                      | Status   | Blocker/Notes                                                 |
| ------------------------- | -------- | ------------------------------------------------------------- |
| Rate limiting per API key | Pending  | Middleware to enforce rateLimit/rateLimitDuration from schema |
| Tool execution sandbox    | Pending  | Timeout wrapper needed - SDK doesn't provide this             |
| Client SDK                | Optional | `@modelcontextprotocol/sdk` already provides full client      |
| WebSocket transport       | Future   | MCP stdio for local; HTTP is standard for remote              |
| Load balancing            | Future   | Requires Redis + multi-instance (premature)                   |
| Response caching          | Future   | Would need Redis                                              |
| Telemetry                 | Partial  | Basic tracking via lastUsedAt; full analytics future          |

### Blocker Details

1. **Rate Limiting per API Key**
   - **What's needed**: Middleware to check API key's `rateLimit`/`rateLimitDuration` on each request, track request counts, return 429 when exceeded
   - **Complexity**: Low - straightforward addition
   - **Files to modify**: `src/lib/mcp/auth.ts` or create new `src/lib/mcp/rate-limit.ts`

2. **Tool Execution Sandbox**
   - **What's needed**: Timeout wrapper around tool handlers, resource monitoring
   - **Complexity**: Medium
   - **Files to modify**: Tool handlers in `src/lib/mcp/tools/*.ts`

### Priority Implementation Order

1. Rate limiting (quick win - low complexity, high value)
2. Tool execution sandbox (medium complexity, safety feature)

---

## Todos

- [x] Install MCP SDK and organization plugin dependencies
- [x] Add MCP API key table to database schema
- [x] Create MCP server core (server.ts, transport.ts, handler.ts)
- [x] Implement API key service (generation, hashing, validation)
- [x] Create MCP authentication layer
- [x] Design and register tool schemas (auth, users, organizations)
- [x] Implement organization-scoped access control
- [ ] Add MCP-specific rate limiting
- [ ] Create tool execution sandbox
- [x] Add health monitoring and metrics
- [x] Create tool discovery endpoint
- [x] Create API key management routes and UI
- [ ] Create client SDK
- [ ] Add telemetry and usage tracking
- [x] Run lint, fmt, typecheck

## Future Enhancements

1. GraphQL-based tool definitions
2. WebSocket transport for streaming
3. Multi-region deployment with Redis
4. Advanced caching with Redis
5. Custom tool registration API
6. Tool chaining for workflows