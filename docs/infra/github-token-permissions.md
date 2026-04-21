# GitHub Token Permissions Guide

This document provides guidance on selecting the appropriate GitHub token permissions for each workflow in this repository.

## Overview

All GitHub Actions workflows require specific permissions to function properly. Two primary secrets are used:

- `GH_TOKEN_CHANGESET`: Used for tagging, releasing, and synchronizing tasks.
- `GH_TOKEN`: Used for PR review automation and other API interactions.

## Required Scopes by Workflow

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Purpose**: Quality checks, security scanning, testing, and build
**Required Scopes**:

```yaml
permissions:
  contents: read
```

**Explanation**:

- `contents: read` - Only needs to checkout code and read repository contents
- No write permissions needed for CI workflow

### 2. Auto-fix Workflow (`.github/workflows/autofix.yml`)

**Purpose**: Automated lint fixes and dependency updates
**Required Scopes**:

```yaml
permissions:
  contents: write
  pull-requests: write
```

**Explanation**:

- `contents: write` - Can modify files and create commits
- `pull-requests: write` - Can push changes back to the branch

### 3. PR Review Workflow (`.github/workflows/pr-review.yml`)

**Purpose**: Automated code reviews using OpenCode
**Required Scopes**:

```yaml
permissions:
  contents: write
  pull-requests: write
```

**Explanation**:

- `contents: write` - Checkout code and configure git
- `pull-requests: write` - Create review comments and manage PR state
- Additional recommended: `admin:repo_hook` for full repository hook management
- Uses secret: `GH_TOKEN`

### 4. Issue Triage Workflow (`.github/workflows/issue-triage.yml`)

**Purpose**: Automated issue categorization and response
**Required Scopes**:

```yaml
permissions:
  contents: write
  issues: write
```

**Explanation**:

- `contents: write` - Checkout code and configure git
- `issues: write` - Create and modify issue comments

### 5. Release Workflow (`.github/workflows/release.yml`)

**Purpose**: Automated releases using changesets
**Required Scopes**:

```yaml
permissions:
  contents: write
```

**Explanation**:

- `contents: write` - Create commits, tags, and releases
- Additional recommended: `packages: write` if publishing to npm
- Uses secret: `GH_TOKEN_CHANGESET`

### 6. Stale Workflow (`.github/workflows/stale.yml`)

**Purpose**: Close inactive issues and PRs
**Required Scopes**:

```yaml
permissions:
  issues: write
  pull-requests: write
```

**Explanation**:

- `issues: write` - Close and label issues
- `pull-requests: write` - Close and label PRs

## Complete Scope Selection

### For Full Functionality (Recommended)

```yaml
# Add to repository secrets or use fine-grained personal access token
permissions:
  contents: write
  pull-requests: write
  issues: write
  repo:status
  admin:repo_hook
  workflow
```

## Configuration Steps

### 1. Repository Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add a new repository secret named `GH_TOKEN_CHANGESET` (for releases)
4. Add a new repository secret named `GH_TOKEN` (for reviews)

### 2. Fine-grained Personal Access Token (Recommended)

For better security, use a fine-grained personal access token:

1. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Select **Repository access** → **Only select repositories** → Choose your repository
4. Grant the following permissions:
   - **Contents**: Read & write
   - **Pull requests**: Read & write
   - **Issues**: Read & write
   - **Commit statuses**: Read & write
   - **Workflows**: Read & write (Required for `GH_TOKEN_CHANGESET`)
   - **Repository hooks**: Full control (optional)

### 3. Legacy Personal Access Token (Alternative)

For backward compatibility, you can use a classic PAT:

1. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token**
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `admin:repo_hook` (Full control of repository hooks)

## Troubleshooting

### Common Error Messages

#### "Must have push access to view collaborator permission"

**Cause**: Missing `pull-requests: write` scope
**Solution**: Add `pull-requests: write` to token permissions

#### "Must have admin rights to Repository"

**Cause**: Missing `admin:repo_hook` or `contents: write` scope
**Solution**: Add `admin:repo_hook` and `contents: write` to token permissions

#### "Failed to checkout repository"

**Cause**: Missing `contents: read` or `contents: write` scope
**Solution**: Add appropriate contents scope based on workflow needs

### Validation

After configuring the token, run a workflow and check:

- Repository checkout succeeds
- Git operations work
- PR/comment operations succeed
- Release operations work (for release workflow)

## Security Considerations

1. **Least Privilege**: Grant only the minimum required scopes for each workflow
2. **Token Rotation**: Regularly rotate your GitHub token
3. **Secret Scanning**: Enable GitHub's secret scanning for added security
4. **Audit Logs**: Monitor token usage through GitHub's audit logs

## References

- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Fine-grained tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-fine-grained-personal-access-token)
- [Repository secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#using-secrets-in-a-workflow)