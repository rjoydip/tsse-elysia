---
title: Contributing
description: Guidelines for contributing to TSS Elysia
---

## Contributing to TSS Elysia

Thank you for your interest in contributing! This project uses [Changelogen](https://github.com/unjs/changelogen) for managing versioning and changelogs using conventional commits.

## Table of Contents

- [Quick Start](#quick-start)
- [Making Changes](#making-changes)
- [Release Workflow](#release-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Release Process](#release-process)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/rjoydip/tsse-elysia.git
cd tsse-elysia

# Initialize git submodules (includes OpenCode devkit)
git submodule update --init

# Install dependencies
bun install

# Start development
bun run dev
```

## Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit your changes with conventional commits**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and create a PR**

   ```bash
   git push origin feat/your-feature-name
   ```

---

## Git Submodules

This project includes the [OpenCode DevKit](https://github.com/rjoydip/opencode-devkit) as a git submodule for local AI tooling.

### Why Submodules?

- Provides consistent OpenCode version across contributors
- Allows local customization of OpenCode behavior
- Separates tooling concerns from main repository

### Setup

```bash
# Initialize submodules after clone
git submodule update --init

# Update submodules to latest
git submodule update --remote

# Or clone with submodules
git clone --recurse-submodules https://github.com/rjoydip/tsse-elysia.git
```

### Working with Submodules

```bash
# Check submodule status
git submodule status

# Pull latest in submodule
cd .opencode
git pull origin main
cd ..
git add .opencode
git commit -m "chore: update opencode devkit"
```

---

## Release Workflow

### How It Works

```bash
┌─────────────────────────────────────────────────────────────────┐
│                    CHANGELOGEN WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

  1. DEVELOPER                2. GITHUB CI                  3. RELEASE
     makes PR                      runs                        creates

  ┌──────────┐              ┌──────────────┐            ┌─────────────┐
  │ Write    │              │ Detect       │            │ Version     │
  │ Conventional│─────────────│ Commits      │────────────│ Bumped      │
  │ Commit   │              │              │            │             │
  │          │              │              │            │ CHANGELOG   │
  │          │              │ Run Tests    │            │ Updated     │
  │          │              │              │            │             │
  │          │              │              │            │ GitHub      │
  │          │              │ Tag +       │            │ Release    │
  │          │              │ Release     │            │ Created    │
  └──────────┘              └──────────────┘            └─────────────┘
```

### Conventional Commits

Changelogen uses conventional commit messages to determine version bumps:

| Commit Type                    | Version Bump | Example         |
| ------------------------------ | ------------ | --------------- |
| `feat:`                        | `minor`      | 1.0.0 → 1.1.0   |
| `fix:`                         | `patch`      | 1.0.0 → 1.0.1   |
| `feat!:` or `BREAKING CHANGE:` | `major`      | 1.0.0 → 2.0.0   |
| Other types                    | none         | No version bump |

### Files Affected

| File           | Before         | After                  |
| -------------- | -------------- | ---------------------- |
| `CHANGELOG.md` | Unchanged      | Updated with new entry |
| `package.json` | Version: 0.0.0 | Version: 0.1.0         |
| Git tags       | None           | `v0.1.0` created       |

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type       | Description                             | Version Bump |
| ---------- | --------------------------------------- | ------------ |
| `feat`     | New feature                             | `minor`      |
| `fix`      | Bug fix                                 | `patch`      |
| `docs`     | Documentation changes                   | -            |
| `style`    | Code style (formatting, no logic)       | -            |
| `refactor` | Code change that neither fixes nor adds | -            |
| `test`     | Adding or updating tests                | -            |
| `chore`    | Maintenance tasks                       | -            |
| `ci`       | CI/CD changes                           | -            |

### Commit Message Examples

```bash
# Good commits
feat: add user pagination support
fix: resolve WebSocket race condition
docs: update API documentation
refactor: simplify error handling
test: add tests for user service
ci: add nightly build workflow

# Bad commits (not descriptive)
fix bug
update code
changes
```

---

## Testing

### Run Tests

```bash
bun test                # Run all unit tests
bun test:watch         # Watch mode for development
bun test:coverage      # With coverage report
```

### Write Tests

- Tests are in `test/` directory
- Use `describe` and `it` blocks
- Follow existing test patterns

```typescript
describe("UserService", () => {
  it("should create a new user", async () => {
    const user = await userService.createUser({
      name: "Test",
      email: "test@example.com",
    });
    expect(user.name).toBe("Test");
  });
});
```

---

## GitHub Actions Secrets

Certain workflows require GitHub secrets to be configured in the repository settings.

### Required Secrets

| Secret     | Workflow(s)     | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| `GH_TOKEN` | `release.yml`   | GitHub token with repo scope for releases |
| `GH_TOKEN` | `pr-review.yml` | GitHub token for PR review automation     |

### Setting Up Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret with its value

### Token Permissions

The `GH_TOKEN` token is used for tagging and releasing. It requires:

- `repo` scope (for repository access and pushing tags)
- `workflow` scope (for managing GitHub Actions workflows and creating releases)

If you see errors during the release process related to authentication, please verify that this token has not expired and has the correct permissions.

For personal access tokens (classic), ensure:

- `repo` checkbox is fully enabled
- `workflow` checkbox is enabled

For fine-grained tokens, ensure it has "Read and write" access to:

- Contents
- Pull requests
- Workflows
- Metadata (Read-only)

---

## Code Quality

### Pre-commit Hooks

Before every commit, these checks run automatically:

- `bun run lint` - Linting and formatting
- `bun run typecheck` - TypeScript type checking
- `bun run react:doctor` - React health check

### Manual Checks

```bash
bun run lint              # Lint + format check
bun run lint:fix          # Auto-fix lint issues
bun run format               # Format code
bun run typecheck         # TypeScript check
```

---

## Release Process

For detailed CI/CD and release documentation, see [CI/CD Documentation](docs/infra/ci-cd.md).

### Manual Release

```bash
# Full release with all validations
bun run script:release

# Preview without making changes
bun run script:release --dry-run

# Skip quality checks (not recommended)
bun run script:release --skip-tests
```

### Changelogen Commands

```bash
# Generate changelog
bun changelogen

# Bump version
bun changelogen --bump

# Create GitHub release
bun changelogen gh release
```

---

## Troubleshooting

### No Release Created

Check:

1. Conventional commits exist (since last tag)
2. PR was merged to `main` (not another branch)
3. GitHub Actions `release.yml` workflow is enabled

### Version Not Updating

After release:

```bash
# Pull latest changes
git pull origin main

# Check version
cat package.json | grep version
```

### Want to Undo Version Bump

```bash
# Reset to before version bump
git reset --hard HEAD~1

# Or revert the commit
git revert <commit-hash>
```

---

## Questions?

- Open an [issue](https://github.com/rjoydip/tsse-elysia/issues)
- Check existing [discussions](https://github.com/rjoydip/tsse-elysia/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.