---
title: Testing
description: Unit, E2E, and load testing guide
---

## Testing

This project uses two testing approaches: unit tests with Bun and E2E tests with Playwright.

## Unit Tests (Bun)

### Running Tests

```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage  # With coverage report
bun test test/config/docs.test.ts  # Run specific test file
```

### Test Structure

Tests are located in `test/`:

```bash
test/
├── config/           # Configuration tests
│   ├── docs.test.ts  # Docs config tests (globKeyToDocPath, getSplatPath, buildDocMap, getDisplayName)
│   └── index.test.ts # App config tests
├── middlewares/      # Middleware tests
│   ├── cors.test.ts  # CORS middleware tests
│   ├── helmet.test.ts # Helmet security headers tests
│   └── index.test.ts # Middleware index tests (traceFn, errorFn, composedMiddleware)
├── hooks/            # Hook tests
├── lib/              # Library tests (logger, blog, utils, changelog)
├── routes/           # Route tests
│   └── status.test.ts # Status page tests
├── store/            # Store tests
├── components/       # Component tests
├── db.test.ts        # Database tests
├── auth.test.ts      # Auth tests
└── fixtures/         # Test fixtures
    └── db.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from "bun:test";
import { createFileRoute } from "@tanstack/react-router";

describe("Home Route", () => {
  it("should create route with path /", () => {
    const route = createFileRoute("/");
    expect(route).toBeDefined();
  });
});
```

### Eden Treaty Tests

Use Eden Treaty for end-to-end type-safe API testing:

```typescript
import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { apiRoutes } from "../src/routes/api/$.ts";

const api = treaty(apiRoutes);

describe("API Endpoints", () => {
  it("should return welcome message", async () => {
    const { data, error, status } = await api.api.get();
    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toContain("Welcome to");
  });

  it("should return health status", async () => {
    const { data, error } = await api.api.health.get();
    expect(error).toBeNull();
    expect(data).toHaveProperty("status", "ok");
  });
});
```

### Available Matchers

Bun's test runner supports Jest-like matchers:

- `expect(value).toBe(expected)`
- `expect(value).toEqual(expected)`
- `expect(value).toBeDefined()`
- `expect(value).toBeTruthy()`
- `expect(value).toHaveLength(n)`
- And more...

## E2E Tests (Playwright)

### Running E2E Tests

```bash
bun run test:e2e        # Run all E2E tests
bun run test:e2e:ui     # Interactive UI mode
bun run test:e2e:headed # Visible browser
bun run test:e2e:report # View HTML report
```

### E2E Test Structure

E2E tests are in `.e2e/`:

```bash
.e2e/
├── ui/               # UI E2E tests (split by component)
│   ├── auth.spec.ts      # Authentication tests
│   ├── button.spec.ts   # Button component tests
│   ├── input.spec.ts    # Input component tests
│   ├── card.spec.ts     # Card component tests
│   ├── badge.spec.ts    # Badge component tests
│   ├── tabs.spec.ts     # Tabs component tests
│   ├── form.spec.ts     # Form integration tests
│   ├── sidebar.spec.ts  # Sidebar navigation tests
│   ├── avatar.spec.ts   # Avatar component tests
│   ├── tooltip.spec.ts  # Tooltip component tests
│   ├── sheet.spec.ts    # Sheet/Drawer component tests
│   ├── dropdown-menu.spec.ts # DropdownMenu tests
│   ├── switch.spec.ts   # Switch component tests
│   ├── select.spec.ts   # Select component tests
│   ├── accordion.spec.ts # Accordion component tests
│   ├── label.spec.ts    # Label component tests
│   ├── table.spec.ts    # Table component tests
│   ├── skeleton.spec.ts # Skeleton component tests
│   ├── navigation.spec.ts # Navigation tests
│   ├── docs.spec.ts      # Documentation page tests
│   ├── root.spec.ts      # Landing page tests
│   ├── profile.spec.ts   # Profile page tests
│   ├── settings.spec.ts  # Settings page tests
│   ├── status.spec.ts    # Status page tests
│   ├── blog.spec.ts      # Blog page tests
│   ├── changelog.spec.ts # Changelog page tests
│   └── mobile.spec.ts    # Mobile responsiveness tests
├── api/              # API E2E tests
│   ├── endpoints.spec.ts # API endpoint tests
│   └── middlewares.spec.ts # Middleware tests (CORS, Helmet, Trace, Rate Limit, Error)
├── mcp/              # MCP E2E tests
│   ├── mcp.spec.ts
│   └── mcp-keys.spec.ts
├── middlewares/       # Middleware-specific tests
│   └── rate-limit.spec.ts # Rate limiting tests
├── auth.spec.ts      # Auth E2E tests
└── config.ts         # E2E configuration (host, port, base URL)
```

E2E configuration is centralized in `.e2e/config.ts` and shared by both `playwright.config.ts` and test files:

```typescript
// .e2e/config.ts
const host = process.env.E2E_HOST || process.env.HOST || "localhost";
const port = process.env.E2E_PORT || process.env.PORT || "3000";

export const E2E_BASE_URL = process.env.E2E_BASE_URL || `http://${host}:${port}`;
export const E2E_HOST = host;
export const E2E_PORT = port;
```

### CI Test Skip Behavior

Some API endpoint tests are skipped in CI environments because the preview server may not be accessible from Playwright's browser. Tests that require actual HTTP requests to the server will automatically skip when `isCI` is detected. Tests that don't require server access (like 404 handling) still run.

### UI Tests (`.e2e/ui/*.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";

test("should display home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome Home!" })).toBeVisible();
});
```

### API Tests (`.e2e/api/*.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";

test("should respond to /api/test", async ({ request }) => {
  const response = await request.get("/api/test");
  expect(response.status()).toBeGreaterThanOrEqual(200);
});
```

### Selectors

- `page.getByRole()` - By ARIA role
- `page.getByText()` - By text content
- `page.getByLabel()` - By form label
- `page.getByPlaceholder()` - By input placeholder
- `page.locator()` - Custom selectors

### Configuration

Edit `playwright.config.ts`:

```typescript
import { E2E_BASE_URL, E2E_HOST, E2E_PORT } from "./.e2e/config";

export default defineConfig({
  testDir: "./.e2e",
  baseURL: E2E_BASE_URL,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `bun run preview --host=${E2E_HOST} --port=${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
```

Override via environment variables:

```bash
E2E_HOST=0.0.0.0 E2E_PORT=4173 bun run test:e2e
# Or use full URL
E2E_BASE_URL=http://custom:4173 bun run test:e2e
```

## CI Integration

E2E tests run automatically in GitHub Actions:

```yaml
- name: Install Playwright browsers
  run: bunx playwright install --with-deps chromium

- name: Run E2E tests
  run: bun run test:e2e
```

### Docker Security Scanning (Trivy)

The CI pipeline includes container security scanning using Trivy. This scans the built Docker image for vulnerabilities and malware before deployment.

#### What Gets Scanned

- **Vulnerabilities**: Scans for known CVEs in OS packages and application dependencies
- **Malware**: Scans for known malicious files or patterns

#### Configuration

The Trivy scan is configured in `.github/workflows/ci.yml`:

```yaml
docker-scan:
  name: Docker Security Scan
  runs-on: ubuntu-latest
  needs: [test]
  steps:
    - name: Build Docker image
      uses: docker/build-push-action@v6
      with:
        context: .
        file: docker/Dockerfile
        load: true
        tags: tsse-elysia:${{ github.sha }}

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: "tsse-elysia:${{ github.sha }}"
        severity: "CRITICAL,HIGH"
        exit-code: "1"
        ignore-unfixed: true
```

#### Scan Behavior

| Setting        | Value          | Description                       |
| -------------- | -------------- | --------------------------------- |
| Severity       | CRITICAL, HIGH | Only fail on critical/high issues |
| Ignore unfixed | true           | Don't fail for known unfixed CVEs |
| Exit code      | 1              | Block PR if critical issues found |
| Malware scan   | enabled        | Scan for malware patterns         |

The scan runs after tests pass (`needs: [test]`) to avoid scanning failed builds.

## Load Tests (k6)

### Running Load Tests

```bash
bun run test:load        # Run smoke test
bun run test:load:api    # Run API load test
bun run test:load:stress # Run stress test
```

### Load Test Structure

Load tests are in `.k6/`:

```bash
.k6/
  smoke-test.js   # Basic smoke test
  api-test.js    # API endpoint load test
  stress-test.js # Stress test
```

### Load Test Configuration

Configure using environment variables:

```bash
# Use custom host/port
HOST=localhost PORT=3000 bun run test:load

# Or use BASE_URL directly
BASE_URL=http://localhost:3000 bun run test:load
```

Supported variables:

- `HOST` - Server host (default: `localhost`)
- `PORT` - Server port (default: `3000`)
- `BASE_URL` - Full URL override

### Test Types

- **Smoke Test** - Basic validation with low load (1 VU, 10s)
- **API Test** - Tests `/api` endpoint
- **Stress Test** - High load testing

## Best Practices

1. **Unit tests** - Test isolated logic, components, utilities
2. **E2E tests** - Test critical user flows
3. **Load tests** - Validate performance under load
4. **Run locally** - Always run tests before committing
5. **Keep tests focused** - One assertion per test when possible
6. **Use meaningful names** - Describe what you're testing