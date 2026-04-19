---
title: Troubleshooting
description: Common issues and solutions
---

## Troubleshooting

This document covers common issues and their solutions.

## Build Issues

### Large Bundle Size Warning

```txt
(!) Some chunks are larger than 500 kB after minification.
```

**Cause**: Third-party libraries (better-auth, React, Drizzle) are bundled together.

**Solution**: The `vite.config.ts` includes manual code splitting:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes("node_modules")) {
          if (id.includes("better-auth")) return "vendor-auth";
          if (id.includes("@tanstack")) return "vendor-router";
          if (id.includes("react")) return "vendor-react";
          if (id.includes("drizzle")) return "vendor-db";
          if (id.includes("kysely")) return "vendor-kysely";
          return "vendor";
        }
      },
    },
  },
  chunkSizeWarningLimit: 1000,
}
```

If warnings persist, increase the limit or consider:

- Using dynamic `import()` for lazy loading
- Splitting the application into micro-frontends

---

### LibSQL/Node SQLite Module Issues

```txt
Module "libsql" has been externalized for browser compatibility
```

**Cause**: The database driver (`@libsql/client`) is server-only but Vite tries to bundle it for the browser.

**Solution**: This is expected behavior. The module is correctly externalized for SSR. To suppress the warning:

```typescript
// vite.config.ts
export default defineConfig({
  ssr: {
    noExternal: ["drizzle-orm"],
  },
});
```

Or in `src/lib/db/index.ts`, add a check:

```typescript
// This file only runs on server
if (typeof window !== "undefined") {
  throw new Error("Database can only be used server-side");
}
```

---

## E2E Test Issues

### Module Not Found Error

```txt
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'dist/server/server.js'
```

**Cause**: The E2E tests try to run `bun preview` but the server file path is different.

**Solution**: Update `playwright.config.ts` to build first:

```typescript
import { E2E_BASE_URL, E2E_HOST, E2E_PORT } from "./.e2e/config";

webServer: {
  command: "bun run build && bun run preview",
  url: E2E_BASE_URL,
  timeout: 300 * 1000,
},
```

Then run tests:

```bash
bun run test:e2e
```

---

### Server Not Starting

If E2E tests fail to start the server:

1. Check if port is available:

   ```bash
   lsof -i :3000
   ```

2. Run manually to see errors:

   ```bash
   bun run build && bun run preview
   ```

3. Check logs:

   ```bash
   bun run test:e2e 2>&1
   ```

---

## Database Issues

### Migration Failed

```txt
Error: unable to open database file
```

**Solution**:

1. Create the data directory:

   ```bash
   mkdir -p data
   ```

2. Run migrations:

   ```bash
   bun run db:migrate
   ```

3. Set SQLITE_URL in environment:

   ```bash
   SQLITE_URL=file:data/.db bun run db:migrate
   ```

---

### Seeding Failed

```txt
SQLiteError: UNIQUE constraint failed
```

**Solution**: The seed script is idempotent. Simply re-run:

```bash
bun run db:seed
```

---

## Docker Issues

### Container Won't Start

1. Check BETTER_AUTH_SECRET is set:

   ```bash
   docker logs tsse-elysia
   ```

2. Verify port availability:

   ```bash
   lsof -i :3000
   ```

3. Check volume permissions:

   ```bash
   docker exec tsse-elysia ls -la /app/.artifacts
   ```

---

### Database in Docker

Ensure persistent volume:

```yaml
# docker-compose.yml
volumes:
  - db-data:/app/.artifacts

volumes:
  db-data:
```

---

## Development Issues

### Hot Reload Not Working

1. Clear Vite cache:

   ```bash
   rm -rf node_modules/.vite
   ```

2. Check file watcher limits (Linux):

   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### TypeScript Errors

Run typecheck to find issues:

```bash
bun run typecheck
```

---

## Performance Issues

### Slow Builds

Enable BuildKit:

```bash
DOCKER_BUILDKIT=1 docker build .
```

### Memory Issues

Increase Bun memory limit:

```bash
BUN_CONFIG_MEMORY_LIMIT=4096 bun run build
```