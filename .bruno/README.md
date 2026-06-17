# Bruno API Collection

This directory contains the Bruno API testing collection for TSSE Elysia.

## Structure

```bash
.bruno/
├── collections/
│   ├── opencollection.yml      # Root collection definition
│   ├── auth/                   # Authentication endpoints
│   ├── dashboard/              # Dashboard endpoints
│   ├── mcp/                    # MCP endpoints
│   ├── roles/                  # Roles & permissions endpoints
│   ├── settings/               # User settings endpoints
│   ├── system/                 # System health endpoints
│   ├── tasks/                  # Tasks endpoints
│   └── users/                  # User management endpoints
├── environments/
│   ├── local.yml               # Bruno isolated environment (localhost:4174)
│   └── ci.yml                  # CI environment (localhost:4173)
├── reports/                    # Generated test reports
├── workspace.yml               # Bruno workspace config
└── README.md
```

## Conventions

### Tag Naming

| Tag      | Purpose                           |
| -------- | --------------------------------- |
| `smoke`  | Run in CI on every PR             |
| `<area>` | Domain area (auth, users, roles…) |

Add the `smoke` tag to any endpoint that should be validated in CI.

### Sequencing (`seq`)

- `seq: 0` — reserved for `auth/sign-in.yml` (must run first to set `session_token`)
- `seq: 1–5` — general requests, ascending order
- Authenticated requests must have `seq > 0` to run after sign-in

Requests are sorted by `seq` globally when running with `--tags`.

### Variable Propagation

| Variable        | Set by                  | Used by                    |
| --------------- | ----------------------- | -------------------------- |
| `session_token` | `auth/sign-in.yml`      | All authenticated requests |
| `user_id`       | `users/create-user.yml` | `users/get-user.yml`       |

Variables are set via `after-response` scripts using `bru.setVar()` and persist for the duration of the Bruno run.

### Adding a New Endpoint

1. Create a `.yml` file in the appropriate domain folder
2. Add `info.type: http` and `http.method`/`http.url`
3. If auth is required, add `http.auth.type: bearer` + `http.auth.token: "{{session_token}}"`
4. Add a `runtime.scripts` test block checking `res.status`
5. Set a unique `seq` value ensuring `> 0` for auth requests
6. Tag with the domain + `smoke` if it should run in CI

## Running

All Bruno commands use an **isolated PGlite database** at `.artifacts/pglite-data-bruno/`
so your development data is never touched:

### Setup

```bash
# Create & seed a fresh isolated database (essential users only)
bun run bruno:seed
```

### Run tests

```bash
# Smoke tests only (recommended for quick validation)
bun run bruno:smoke

# All requests
bun run bruno:run

# CI (uses ci.yml env — port 4173)
bun run bruno:ci
```

### Server lifecycle

```bash
# Start a preview server on port 4174 using the isolated DB
bun run bruno:server

# Clean up the isolated database when done
bun run bruno:cleanup
```

### Full workflow (quick start)

```bash
bun run bruno:seed     # fresh isolated DB at .artifacts/pglite-data-bruno
bun run bruno:server   # start preview on :4174
bun run bruno:smoke    # run smoke tests
bun run bruno:cleanup  # remove isolated DB
```

### How it works

Scripts set `PGLITE_DATA_DIR` internally to `.artifacts/pglite-data-bruno`,
pointing the server to a completely separate PGlite data directory.
The regular dev database at `.artifacts/pglite-data/` is never modified.