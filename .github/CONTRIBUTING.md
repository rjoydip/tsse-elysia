---
title: Contributing
description: Guidelines for contributing to TSS Elysia
---

## Contributing to TSS Elysia

Thank you for your interest in contributing! This project uses [Changesets](https://github.com/changesets/changesets) for managing versioning and changelogs.

## Table of Contents

- [Quick Start](#quick-start)
- [Making Changes](#making-changes)
- [Changesets Workflow](#changesets-workflow)
- [Changesets Deep Dive](#changesets-deep-dive)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Release Process](#release-process)
- [Common Scenarios](#common-scenarios)
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

3. **Add a changeset** (required for releases)

   ```bash
   bun changeset add
   ```

   Follow the prompts:
   - Select the `tsse-elysia` package
   - Choose bump type: `patch`, `minor`, or `major`
   - Write a description of what changed

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create a PR**

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

### Troubleshooting

If submodule initialization fails:

```bash
# Reinitialize submodules
git submodule deinit --all
git submodule update --init --recursive
```

---

## Changesets Workflow

### How It Works

```bash
┌─────────────────────────────────────────────────────────────────┐
│                    CHANGESETS WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

  1. DEVELOPER                2. GITHUB CI                  3. RELEASE
     creates PR                      runs                        creates

  ┌──────────┐              ┌──────────────┐            ┌─────────────┐
  │ Write    │              │ Detect       │            │ Version     │
  │ Code +   │──────────────│ Changesets   │────────────│ Bumped      │
  │ Changeset│              │ in PR        │            │             │
  │ File     │              │              │            │ CHANGELOG   │
  │          │              │ Run Tests    │            │ Updated     │
  │          │              │              │            │             │
  │          │              │              │            │ GitHub      │
  │          │              │              │            │ Release     │
  └──────────┘              └──────────────┘            └─────────────┘
```

### Changeset File Structure

Each changeset is a markdown file in `.changeset/` with:

```markdown
---
"tsse-elysia": minor
---

Your description of the changes.
```

### Bump Types

| Type    | When to Use                    | Example Version |
| ------- | ------------------------------ | --------------- |
| `patch` | Bug fixes, small changes       | 1.0.0 → 1.0.1   |
| `minor` | New features (backward compat) | 1.0.0 → 1.1.0   |
| `major` | Breaking changes               | 1.0.0 → 2.0.0   |

### Files Affected

| File              | Before           | After                  |
| ----------------- | ---------------- | ---------------------- |
| `.changeset/*.md` | Contains changes | Deleted after release  |
| `CHANGELOG.md`    | Unchanged        | Updated with new entry |
| `package.json`    | Version: 0.0.0   | Version: 0.1.0         |
| Git tags          | None             | `v0.1.0` created       |

---

## Changesets Deep Dive

### Step-by-Step Process

#### Step 1: Add a Changeset

```bash
bun changeset add
```

Interactive prompts:

```bash
🦋 Select the package(s) you want to include in this changeset
    ❯ ● tsse-elysia (press <space> to select)

🦋 What kind of change is this?
    ❯ ○ patch - fix: bug fixes
      ○ minor - feat: new features
      ○ major - BREAKING CHANGE

🦋 Write a short description of the change (this will be added to CHANGELOG.md)
> Added pagination to user endpoints
```

Creates file: `.changeset/funny-flowers-speak.md`

```markdown
---
"tsse-elysia": minor
---

Added pagination to user endpoints
```

#### Step 2: Commit Everything

```bash
git add .
git commit -m "feat: add user pagination"
```

#### Step 3: Push and Create PR

```bash
git push origin feat/user-pagination
# Create PR via GitHub UI
```

#### Step 4: CI Runs

For details on CI/CD pipelines, see [CI/CD Documentation](docs/infra/ci-cd.md).

#### Step 5: Changesets Magic

```bash
# What changeset version does internally:

1. Reads all .changeset/*.md files
2. Calculates version bump from all changesets
3. Updates package.json version
4. Updates CHANGELOG.md with entries
5. Creates git commit with version bump
6. Creates git tag
7. Deletes .changeset/*.md files
```

### What Gets Published

When `changeset publish` runs:

1. **GitHub Release** created with:
   - Version tag (e.g., `v0.1.0`)
   - Release notes from CHANGELOG.md
   - Built binaries

2. **CHANGELOG.md** updated:

   ```markdown
   ## [0.1.0] - 2024-01-15

   ### Features

   - Added pagination to user endpoints
   ```

3. **package.json** version updated:

   ```json
   { "version": "0.1.0" }
   ```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type       | Description                             | Changeset |
| ---------- | --------------------------------------- | --------- |
| `feat`     | New feature                             | `minor`   |
| `fix`      | Bug fix                                 | `patch`   |
| `docs`     | Documentation changes                   | -         |
| `style`    | Code style (formatting, no logic)       | -         |
| `refactor` | Code change that neither fixes nor adds | -         |
| `test`     | Adding or updating tests                | -         |
| `chore`    | Maintenance tasks                       | -         |
| `ci`       | CI/CD changes                           | -         |

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
bun run fmt               # Format code
bun run typecheck         # TypeScript check
```

---

## Release Process

For detailed CI/CD and release documentation, see [CI/CD Documentation](docs/infra/ci-cd.md).

---

## Common Scenarios

### Scenario 1: Multiple Changes in One PR

If you have multiple changes, add multiple changeset entries:

```bash
# Add first change
bun changeset add
# > select patch, "Fixed login bug"

# Add second change
bun changeset add
# > select minor, "Added new API endpoint"
```

Result: Combined into single release with combined changelog.

### Scenario 2: No Release Needed

If your changes don't need a release (e.g., docs only):

```bash
# Commit without changeset
git add .
git commit -m "docs: update README"

# Push - no release will be created
git push
```

### Scenario 3: Skip CI for Small Changes

```bash
git commit -m "docs: fix typo [skip ci]"
```

### Scenario 4: Forgot to Add Changeset

```bash
# Add it now
bun changeset add --empty

# Or edit the empty changeset manually
# .changeset/empty.md will be created
```

### Scenario 5: Want to Test Version Bump Locally

```bash
# Preview what would happen
bun changeset version --dry-run

# Actually run it
bun changeset version

# Check the changes
git diff

# If satisfied, push
git push

# If not, reset
git reset --hard HEAD~1
```

### Scenario 6: Breaking Change

```bash
bun changeset add
# Select "major"

# Write description mentioning breaking change
# > BREAKING: Removed deprecated /api/old endpoint
```

This creates:

```markdown
---
"tsse-elysia": major
---

BREAKING: Removed deprecated /api/old endpoint
```

---

## Troubleshooting

### "No changesets found"

```txt
🦋 error No changesets found. Run `changeset add` to create one.
```

**Solution:** You need to add a changeset with `bun changeset add`

### "Some packages have been changed but no changesets were found"

```txt
🦋 Some packages have been changed but no changesets were found.
```

**Solution:**

```bash
# Option 1: Add changeset
bun changeset add

# Option 2: Mark as no release needed
bun changeset add --empty
```

### Changeset Not Creating Release

Check:

1. Changeset file exists in `.changeset/`
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

### Want to Undo Changeset Version

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