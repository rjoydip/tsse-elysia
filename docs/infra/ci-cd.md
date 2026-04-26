---
title: CI/CD
description: Continuous integration and deployment pipelines
---

## CI/CD

This document covers the continuous integration and deployment pipelines for this project.

## GitHub Actions Workflows

| Workflow           | Trigger          | Purpose                         |
| ------------------ | ---------------- | ------------------------------- |
| `ci.yml`           | PR/Push to main  | Quality checks, tests, builds   |
| `autofix.yml`      | PR opened/synced | Auto-fix lint issues            |
| `release.yml`      | Push to main     | Create releases with changesets |
| `nightly.yml`      | Daily/manual     | Dev builds                      |
| `issue-triage.yml` | Issues opened    | AI-powered issue triage         |
| `pr-review.yml`    | PR opened/synced | AI-powered PR review            |

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

1. A PR with a changeset is merged to `main`
2. The GitHub Actions workflow runs
3. All quality checks pass (lint, typecheck, tests)
4. Security audit passes
5. Docker image scan (Trivy) passes
6. Build completes successfully
7. Version is bumped and changelog is updated
8. **Git tag is created** (e.g., `v1.2.0`)
9. A GitHub Release is created with release notes

### Release Workflow Steps

```bash
┌─────────────────────────────────────────────────────────────────┐
│                    RELEASE WORKFLOW                              │
└─────────────────────────────────────────────────────────────────┘

 1. VALIDATION         2. QUALITY          3. BUILD
    ├─ Working tree      ├─ Lint            ├─ Run db:setup
    └─ Changesets       ├─ Typecheck       ├─ Build Docker image
                       ├─ Tests           ├─ Trivy Security Scan
                       ├─ Security audit  └─ Build app
                       └─ Trivy Scan
```

4.  VERSION BUMP 5. GIT TAG 6. GITHUB RELEASE
    ├─ Run changeset ├─ Create tag ├─ Create release
    │ version │ vX.Y.Z └─ Add release notes
    ├─ Update CHANGELOG
    └─ Update package.json

````

### Version Bump Types

| Type    | When to Use                       | Example Version |
| ------- | --------------------------------- | --------------- |
| `patch` | Bug fixes, small changes          | 1.0.0 → 1.0.1   |
| `minor` | New features, backward compatible | 1.0.0 → 1.1.0   |
| `major` | Breaking changes                  | 1.0.0 → 2.0.0   |

### Automated Tag Creation

The release workflow automatically:

1. **Creates a semantic version tag** (e.g., `v1.2.0`)
2. **Pushes the tag to remote** (`git push origin v1.2.0`)
3. **Creates GitHub Release** with the tag
4. **Generates release notes** from CHANGELOG.md

Tags follow [SemVer](https://semver.org/) format: `vMAJOR.MINOR.PATCH`

### Nightly Builds

Dev builds are automatically created daily at midnight UTC:

- Version: `0.0.0-dev.YYYYMMDD.commitCount`
- Download from "Nightly Dev" GitHub Release
- **Not for production use**

## Manual Release

Using the release script:

```bash
# Full release (recommended)
bun run release

# Dry run (preview changes)
bun run release --dry-run

# Skip quality checks (not recommended)
bun run release --skip-tests

# Skip git tagging
bun run release --skip-tag

# Skip push to remote
bun run release --skip-push
````

### Release Validation

Before releasing, the workflow validates:

1. Working tree is clean (no uncommitted changes)
2. Changesets exist (nothing to release if not)
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
| `GH_TOKEN_CHANGESET` | GitHub token with repo/workflow scope for releases | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GH_TOKEN`           | GitHub token for API access (PR reviews)           | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `BETTER_AUTH_SECRET` | Secret for Better Auth                             | `your-secret-key-here`                   |

### Variables

| Variables        | Description                      | Example Value           |
| ---------------- | -------------------------------- | ----------------------- |
| `OPENCODE_MODEL` | Model identifier for Opencode AI | `nemotron-3-super-free` |

Required configuration:

- `GH_TOKEN_CHANGESET` - GitHub token for tagging, releasing, and synchronization
- `GH_TOKEN` - GitHub token for PR review automation
- `BETTER_AUTH_SECRET` - Secret for Better Auth authentication
- `OPENCODE_MODEL` - Model identifier for Opencode AI (required for GitHub Actions workflows)