---
title: CI/CD
description: Continuous integration and deployment pipelines
---

## CI/CD

This document covers the continuous integration and deployment pipelines for this project.

## GitHub Actions Workflows

| Workflow           | Trigger               | Purpose                          |
| ------------------ | --------------------- | -------------------------------- |
| `ci.yml`           | PR/Push to main       | Quality checks, tests, builds    |
| `autofix.yml`      | PR opened/synced      | Auto-fix lint issues             |
| `versioning.yml`   | PR opened/synced/push | Version calculation (PR + main)  |
| `release.yml`      | Push to main          | Create releases with changelogen |
| `nightly.yml`      | Daily/manual          | Dev builds                       |
| `issue-triage.yml` | Issues opened         | AI-powered issue triage          |
| `pr-review.yml`    | PR opened/synced      | AI-powered PR review             |

## Versioning Workflow

The `versioning.yml` workflow handles automatic version management for PRs and releases.

### Version Scheme

| Type               | Format                | Example           | Release Created? |
| ------------------ | --------------------- | ----------------- | ---------------- |
| PR Pre-release     | `X.Y.Z-rc.<PR#>`      | `1.2.3-rc.42`     | No               |
| Hotfix Pre-release | `X.Y.Z-hotfix.<N>`    | `1.2.3-hotfix.1`  | No               |
| Main Merge         | `X.Y.Z` (patch)       | `1.2.4`           | Yes              |
| Manual Bump        | `X.Y.Z` (minor/major) | `1.3.0` / `2.0.0` | Yes              |

### PR Pre-release Behavior

- On every push to a PR, the workflow calculates a pre-release version
- Updates `package.json` with the calculated version
- **No release is created** while the PR is open
- Uses PR number for deterministic versioning (no collision)

### Main Branch Merge

- On push to main, release.yml workflow runs independently
- **release.yml is the source of truth** for actual releases
- versioning.yml provides informational version display only
- Auto-detects bump type from commits:
  - `BREAKING CHANGE:` → major bump
  - `feat:` → minor bump
  - Otherwise → patch bump
- Manual bump via `workflow_dispatch` (patch/minor/major)
- Auto-detects bump type from commits:
  - `BREAKING CHANGE:` → major bump
  - `feat:` → minor bump
  - Otherwise → patch bump
- Manual bump via `workflow_dispatch` (patch/minor/major)

### Hotfix Branches

Branches named `hotfix/*` generate pre-release versions like `1.2.3-hotfix.1` while open, then convert to patch bump on merge.

## Quality Gates

All workflows run the following checks:

1. **Lint** - Code style and formatting
2. **TypeScript** - Type checking
3. **Tests** - Unit and E2E tests
4. **Security Audit** - Dependency vulnerabilities
5. **Container Security** - Trivy image scanning (vulnerabilities and malware)

## CI Process

When you push changes or open a PR, the CI workflow runs:

```yaml
# ci.yml triggers on:
on:
  push:
    branches: [main]
  pull_request:
```

Steps executed:

1. Checkout code
2. Install dependencies
3. Run lint, typecheck, tests
4. Build Docker image and run Trivy scan
5. Build application

## Release Process

### Automated Releases

Releases are **automatically** created when:

1. Conventional commits (feat:, fix:, etc.) exist since last tag
2. The GitHub Actions workflow runs
3. All quality checks pass (lint, typecheck, tests)
4. Security audit passes
5. Docker image scan (Trivy) passes
6. Build completes successfully
7. Version is bumped with changelogen and changelog is updated
8. **Git tag is created** (e.g., `v1.2.0`)
9. A GitHub Release is created with release notes via changelogithub

### Release Workflow Steps

```bash
┌─────────────────────────────────────────────────────────────────┐
│                    RELEASE WORKFLOW                              │
└─────────────────────────────────────────────────────────────────┘

  1. VALIDATION         2. QUALITY          3. BUILD
     ├─ Working tree      ├─ Lint            ├─ Run db:setup
     └─ Conventional    ├─ Typecheck       ├─ Build Docker image
        Commits         ├─ Tests           ├─ Trivy Security Scan
                        ├─ Security audit  └─ Build app
                        └─ Trivy Scan
```

4. VERSION BUMP 5. GIT TAG 6. GITHUB RELEASE
   ├─ Run changelogen ├─ Create tag ├─ Create release (changelogithub)
   │ --bump │ vX.Y.Z └─ Add release notes
   ├─ Update CHANGELOG
   └─ Update package.json

````

### Version Bump Types

Changelogen auto-detects version from conventional commits:

| Commit Type              | Version Bump | Example Version |
| ------------------------ | ------------- | --------------- |
| `fix:`                   | `patch`       | 1.0.0 → 1.0.1   |
| `feat:`                  | `minor`       | 1.0.0 → 1.1.0   |
| `feat!:` or `BREAKING CHANGE:` | `major`   | 1.0.0 → 2.0.0   |

### Automated Tag Creation

The release workflow automatically:

1. **Creates a semantic version tag** (e.g., `v1.2.0`)
2. **Pushes the tag to remote** (`git push origin v1.2.0`)
3. **Creates GitHub Release** with the tag
4. **Generates release notes** from CHANGELOG.md

Tags follow [SemVer](https://semver.org/) format: `vMAJOR.MINOR.PATCH`

### Nightly Builds

Dev builds are automatically created daily at midnight UTC via `.github/workflows/nightly.yml`.

**Schedule:** `cron: 0 0 * * *` (daily) + manual trigger via `workflow_dispatch`

**Workflow:**

```text
[Schedule Trigger] → Quality Checks → Unit Tests ─┐
                                        ├─ Build & Artifact ─┐
                                        └─ E2E Tests ────────┤
                                                            ↓
                                              Create Nightly Release
```

**Jobs:**

| Job       | Description                                      |
| --------- | ------------------------------------------------ |
| `quality` | Lint and typecheck (reuses `run-quality-checks`) |
| `test`    | Unit tests with coverage, uploaded to Codecov    |
| `build`   | Production build, uploaded as artifact (30 days) |
| `e2e`     | End-to-end tests with Playwright                 |
| `release` | Creates "Nightly" GitHub Release with artifacts  |

**Version scheme:** `0.0.0-dev.YYYYMMDD.<short-sha>` — unique per day, no semver bump.

**Artifacts:**
- Full `dist/` build output
- `.tar.gz` and `.zip` archives

**Release management:**
- Single "Nightly" GitHub Release (prerelease), overwritten daily
- Old workflow runs pruned after 30 entries
- **Not for production use**

**Required secrets:**

| Secret               | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `GH_TOKEN`           | Creating/updating nightly release         |
| `BETTER_AUTH_SECRET` | Preview server for E2E tests              |
| `CODECOV_TOKEN`      | Coverage upload (optional, non-blocking)  |

## Manual Release

Using the release script:

```bash
# Full release (recommended)
bun run script:release

# Dry run (preview changes)
bun run script:release --dry-run

# Skip quality checks (not recommended)
bun run script:release --skip-tests

# Skip git tagging
bun run script:release --skip-tag

# Skip push to remote
bun run script:release --skip-push
````

Changelogen commands:

```bash
bun changelogen              # Generate changelog
bun changelogen --bump       # Bump version
bun changelogen gh release   # Create GitHub release
```

### Release Validation

Before releasing, the workflow validates:

1. Working tree is clean (no uncommitted changes)
2. Conventional commits exist (nothing to release if not)
3. Linting passes
4. TypeScript type checking passes
5. Unit tests pass
6. Security audit passes
7. Build completes successfully

If any step fails, the release is aborted.

### Configuration

The following GitHub secrets and variables are required for CI/CD workflows:

### Secrets

| Secrets              | Description                                        | Example Value                            |
| -------------------- | -------------------------------------------------- | ---------------------------------------- |
| `GH_TOKEN`           | GitHub token with repo/workflow scope for releases | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `BETTER_AUTH_SECRET` | Secret for Better Auth                             | `your-secret-key-here`                   |
| `CODECOV_TOKEN`      | Codecov token for code coverage reporting          | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`   |

### Variables

| Variables        | Description                      | Example Value           |
| ---------------- | -------------------------------- | ----------------------- |
| `OPENCODE_MODEL` | Model identifier for Opencode AI | `nemotron-3-super-free` |

Required configuration:

- `GH_TOKEN` - GitHub token for tagging, releasing
- `BETTER_AUTH_SECRET` - Secret for Better Auth authentication
- `CODECOV_TOKEN` - Codecov token for code coverage reporting
- `OPENCODE_MODEL` - Model identifier for Opencode AI (required for GitHub Actions workflows)