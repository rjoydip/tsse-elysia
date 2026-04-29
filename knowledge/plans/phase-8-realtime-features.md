# Phase 8: Real-time Features - Implementation Plan

## Overview

This document provides a comprehensive plan for implementing real-time features with security and authentication as foundational requirements.

## Technology Selection & Setup

### Technology Choice

- **Primary**: ElysiaJS WebSocket plugin (`@elysiajs/ws`)
- **Fallback**: Server-Sent Events (SSE) for simpler use cases
- **Client**: Native WebSocket API with custom connection manager

### Infrastructure Setup

1. Create real-time service module: `src/lib/realtime.ts`
2. Configure WebSocket server with proper CORS and origin validation
3. Set up connection lifecycle management (connect/disconnect/heartbeat)
4. Add health check endpoint for WebSocket service

### Dependencies

```bash
bun add @elysiajs/ws
```

---

## 1. Security & Authentication Implementation

### 1.1 Connection Authentication

| Task                            | Description                                      | Location                                |
| ------------------------------- | ------------------------------------------------ | --------------------------------------- |
| WebSocket Handshake Interceptor | Validate session tokens during handshake         | `src/lib/realtime/auth.ts`              |
| Session Token Extraction        | Extract and verify JWT from headers/query params | `src/lib/realtime/auth.ts`              |
| Reject Unauthenticated          | Block connections without valid session          | `src/plugins/websocket.ts`              |
| Connection User Mapping         | Store user session data with connection          | `src/lib/realtime/stores/connection.ts` |

### 1.2 Message-Level Security

| Task                         | Description                                   | Location                            |
| ---------------------------- | --------------------------------------------- | ----------------------------------- |
| Message Validation Schema    | Validate all incoming messages with Zod       | `src/lib/realtime/schema.ts`        |
| Content Sanitization         | Sanitize user-generated content               | `src/lib/realtime/sanitizer.ts`     |
| RBAC for Messages            | Role-based access for different message types | `src/lib/realtime/authorization.ts` |
| Per-Connection Rate Limiting | Limit messages/minute per connection          | `src/lib/realtime/rate-limit.ts`    |

### 1.3 Transport Security

| Task                  | Description                                 | Location                   |
| --------------------- | ------------------------------------------- | -------------------------- |
| WSS in Production     | Configure reverse proxy for WSS://          | `nginx.conf`               |
| Origin Validation     | Prevent cross-site WebSocket hijacking      | `src/plugins/websocket.ts` |
| CSRF Token Validation | Validate tokens on connection establishment | `src/lib/realtime/csrf.ts` |
| Forward Secrecy       | Use ephemeral keys for sensitive data       | `nginx.conf`               |

---

## 2. Connection Management

### 2.1 Lifecycle Handling

```typescript
// Heartbeat configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MISSED_HEARTBEATS_LIMIT = 5;
const CONNECTION_TIMEOUT = 300000; // 5 minutes
```

| Task                | Description                                         |
| ------------------- | --------------------------------------------------- |
| Heartbeat/Ping-Pong | Send ping every 30s, disconnect after 5 missed      |
| Connection Tracking | Track connected users with in-memory or Redis store |
| Graceful Disconnect | Clean up resources, notify others on disconnect     |

### 2.2 Reconnection Strategy

| Component           | Implementation                                 |
| ------------------- | ---------------------------------------------- |
| Exponential Backoff | 1s, 2s, 4s, 8s, 16s (max)                      |
| Message Persistence | Store unsent messages in localStorage          |
| Session Resumption  | Re-establish context after brief disconnects   |
| UI Indicators       | Visual status (connected/reconnecting/offline) |

---

## 3. Feature Implementation

### 3.1 Real-time Notifications

**Service**: `src/lib/realtime/services/notification.ts`

| Feature              | Implementation                               |
| -------------------- | -------------------------------------------- |
| Notification Fan-out | Broadcast to specific users                  |
| Unread Count         | Track and sync unread count per user         |
| TTL Storage          | Store notifications with expiration          |
| Categories           | Support mentions, reactions, system messages |

**API Design**:

```typescript
interface Notification {
  id: string;
  userId: string;
  type: "mention" | "reaction" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}
```

### 3.2 Live User Presence

**Service**: `src/lib/realtime/services/presence.ts`

| Feature           | Implementation                            |
| ----------------- | ----------------------------------------- |
| Status Tracking   | Online/offline/away with periodic updates |
| Typing Indicators | Debounced typing events (300ms)           |
| Last Seen         | Privacy-aware timestamps                  |
| Presence Channels | Context-aware presence (team, channel)    |

### 3.3 Real-time Dashboard Updates

**Service**: `src/lib/realtime/services/dashboard.ts`

| Feature                | Implementation                              |
| ---------------------- | ------------------------------------------- |
| Optimistic Updates     | Immediate UI + server reconciliation        |
| Granular Subscriptions | Subscribe to specific resources             |
| Diff Updates           | Minimize bandwidth with incremental updates |
| Backpressure Handling  | Queue for high-frequency updates            |

### 3.4 Chat/Messaging Infrastructure

**Service**: `src/lib/realtime/services/chat.ts`

| Feature             | Implementation                        |
| ------------------- | ------------------------------------- |
| Message Persistence | Database storage with Drizzle ORM     |
| Read Receipts       | Track delivered and read status       |
| Edit/Delete Trail   | Audit trail for message modifications |
| Reactions           | Emoji reactions with real-time sync   |

---

## 4. Audit Logging & Monitoring

### 4.1 Connection Auditing

| Event                 | Log Data                                                  |
| --------------------- | --------------------------------------------------------- |
| Connection Attempt    | IP, timestamp, success/failure, userId (if authenticated) |
| Authentication Method | Token type, validation result                             |
| Disconnection         | Reason (timeout, error, client-initiated)                 |
| Message Volume        | UserId, message count, message type                       |

### 4.2 Monitoring & Alerts

**Metrics to Track**:

- Active WebSocket connections (gauge)
- Connection attempts per minute (counter)
- Messages sent/received per minute (histogram)
- Connection errors per minute (counter)
- Average heartbeat latency (histogram)

**Dashboard**: Create Grafana dashboard with panels for:

- Connection count over time
- Messages per second
- Error rate by type
- Top users by message volume

---

## 5. Testing & Validation

### 5.1 Security Testing

| Test Type             | Description                                  |
| --------------------- | -------------------------------------------- |
| Penetration Testing   | Test WebSocket endpoints for vulnerabilities |
| Authentication Bypass | Verify all endpoints require valid session   |
| DoS Resistance        | Test rate limiting effectiveness             |
| XSS via Messages      | Validate message sanitization                |

### 5.2 Functional Testing

| Test Suite    | Coverage                      |
| ------------- | ----------------------------- |
| E2E Tests     | Full real-time feature flows  |
| Load Testing  | 1000+ concurrent connections  |
| Cross-browser | Chrome, Firefox, Safari, Edge |
| Mobile        | iOS Safari, Chrome Mobile     |

---

## 6. File Structure

```bash
src/
├── lib/
│   └── realtime/
│       ├── index.ts              # Main entry point
│       ├── auth.ts               # Connection authentication
│       ├── stores/
│       │   └── connection.ts   # Connection management
│       ├── schema.ts            # Message validation schemas
│       ├── sanitizer.ts          # Content sanitization
│       ├── authorization.ts      # RBAC for messages
│       ├── rate-limit.ts         # Per-connection rate limiting
│       ├── csrf.ts               # CSRF validation
│       ├── services/
│       │   ├── notification.ts
│       │   ├── presence.ts
│       │   ├── dashboard.ts
│       │   └── chat.ts
├── plugins/
│   └── websocket.ts              # Elysia WebSocket plugin
├── router.tsx                  # TanStack Router
└── routes/
    └── api/
        └── ws.ts                 # WebSocket upgrade endpoint
```

---

## 7. Environment Variables

```env
# WebSocket Configuration
WS_ENABLED=true
WS_HEARTBEAT_INTERVAL=30000
WS_CONNECTION_TIMEOUT=300000
WS_MAX_MESSAGE_SIZE=10240
WS_RATE_LIMIT_MESSAGES=60
WS_RATE_LIMIT_WINDOW=60000

# Redis (for scaling)
REDIS_URL=redis://localhost:6379
```

---

## 8. Implementation Timeline

### Week 1: Core Infrastructure

- [x] Set up WebSocket plugin and basic connection handling
- [x] Implement connection authentication
- [x] Add heartbeat and connection lifecycle
- [x] Create connection store

### Week 2: Security & Features

- [x] Implement message validation and sanitization
- [x] Add rate limiting
- [x] Implement notification service
- [x] Add presence tracking

### Week 3: Advanced Features

- [x] Implement dashboard real-time updates
- [x] Build chat/messaging infrastructure
- [x] Add audit logging

### Week 4: Testing & Deployment

- [x] Security testing (connection auth, message validation, rate limiting)
- [ ] Load testing (1000+ concurrent connections)
- [ ] Monitoring setup
- [x] Documentation
- [x] Unit tests added
- [x] E2E tests added (framework ready, requires running server)

---

## 9. References

- [ElysiaJS WebSocket](https://elysiajs.com/plugins/websocket.html)
- [WebSocket Security Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#websocket-security)
- [MDN WebSocket Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.IO Best Practices](https://socket.io/docs/v4/)

---

## Notes

- Always require authentication for WebSocket connections
- Use WSS:// in production (never WS://)
- Implement both client and server-side validation
- Plan for graceful degradation if WebSocket is blocked
- Consider Safari's limited WebSocket support (use SSE fallback)