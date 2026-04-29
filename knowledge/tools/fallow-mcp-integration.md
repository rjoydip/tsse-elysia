---
title: Fallow MCP Integration
description: Guide for integrating Fallow with AI agents via MCP (Model Context Protocol)
---

# Fallow MCP Integration

> Integrate fallow with AI agents via CLI and MCP. Unused code, duplication, complexity hotspots, boundary violations, and auto-fix in Claude Code, Cursor, and Windsurf.

## Why Agents Need Fallow

Codebase analysis means building and traversing a graph, not reading files in a context window.

| What Agents Can't Do                                            | What Fallow Does                                        |
| :-------------------------------------------------------------- | :------------------------------------------------------ |
| Build a complete module graph across 5,000+ files               | Builds the full graph in ~200ms                         |
| Track re-export chains through barrel files                     | Resolves `export *` chains through unlimited levels     |
| Know if an export is used outside their context window          | Exhaustively checks every import in the entire codebase |
| Detect code duplication across files they haven't seen          | Suffix array algorithm catches clones across all files  |
| Determine which `package.json` dependencies are actually unused | Traces imports and script binaries to actual usage      |
| Guarantee completeness (no missed files, no false negatives)    | Deterministic: same input always produces same output   |

## CLI: Primary Agent Interface

Every AI coding agent can run shell commands. No MCP required:

```bash
# Full dead code analysis with JSON output
fallow dead-code --format json

# Only check changed files (great for agent PR workflows)
fallow dead-code --changed-since main --format json

# Find code duplication
fallow dupes --format json

# Preview what auto-fix would remove
fallow fix --dry-run --format json

# Apply fixes (agents should use --yes to skip confirmation)
fallow fix --yes --format json

# Detect feature flags and environment gates
fallow flags --format json

# List project info (plugins, entry points, file count)
fallow list --format json
```

**Tip:** Always use `--format json` when agents run fallow. JSON output is structured, machine-readable, and easy for LLMs to parse.

### Agent Workflow Examples

**After generating code:**

```bash
# Agent generates a new feature, commits, then checks its own work
fallow dead-code --changed-since main --format json
# → finds that the old utility file is now unused
# → agent removes it
```

**Codebase cleanup:**

```bash
# Agent is asked to clean up dead code
fallow dead-code --format json
# → returns 401 issues: unused files, exports, dependencies
fallow fix --yes --format json
# → auto-removes unused exports and dependencies
# Agent then deletes unused files from the JSON output
```

**Before a PR:**

```bash
# Agent verifies its changes don't introduce dead code
fallow dead-code --changed-since main --format json
# → clean: no new issues introduced
```

## MCP: Structured Tool Calling

For agents that support MCP (Model Context Protocol), `fallow-mcp` exposes analysis as structured tools. Agents get typed inputs and outputs instead of parsing CLI text.

The MCP server uses stdio transport and wraps the `fallow` CLI binary. Set the `FALLOW_BIN` environment variable to point to the fallow binary (defaults to `fallow` in `PATH`).

### MCP Configuration

**Claude Code** - Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "fallow": {
      "command": "fallow-mcp"
    }
  }
}
```

**Cursor** - Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "fallow": {
      "command": "fallow-mcp"
    }
  }
}
```

**Other MCP clients** - Launch `fallow-mcp` as a stdio subprocess:

```bash
# Start the MCP server directly
fallow-mcp

# With a custom fallow binary path
FALLOW_BIN=/usr/local/bin/fallow fallow-mcp
```

### Available MCP Tools

| Tool                     | Description                                                                                               |
| :----------------------- | :-------------------------------------------------------------------------------------------------------- |
| `analyze`                | Full dead code analysis (`fallow dead-code --format json`)                                                |
| `check_changed`          | Incremental analysis of changed files (`fallow dead-code --changed-since`)                                |
| `find_dupes`             | Code duplication detection (`fallow dupes --format json`)                                                 |
| `fix_preview`            | Dry-run auto-fix preview (`fallow fix --dry-run --format json`)                                           |
| `fix_apply`              | Apply auto-fixes (`fallow fix --yes --format json`)                                                       |
| `check_health`           | Complexity metrics, file health scores, hotspots, and refactoring targets (`fallow health --format json`) |
| `check_runtime_coverage` | (Paid) Merge runtime coverage data into health report                                                     |
| `audit`                  | Audit changed files for dead code, complexity, and duplication (`fallow audit --format json`)             |
| `project_info`           | Project metadata, plugins, files, and entry points (`fallow list --format json`)                          |
| `feature_flags`          | Detect feature flag patterns in the codebase (`fallow flags --format json`)                               |
| `list_boundaries`        | Architecture boundary zones and access rules (`fallow list --boundaries --format json`)                   |
| `trace_export`           | Trace why an export is used or unused (`fallow dead-code --trace FILE:EXPORT_NAME`)                       |
| `trace_file`             | Trace all graph edges for a file (`fallow dead-code --trace-file PATH`)                                   |
| `trace_dependency`       | Trace where a dependency is imported (`fallow dead-code --trace-dependency PACKAGE`)                      |
| `trace_clone`            | Trace duplicate-code groups at a location (`fallow dupes --trace FILE:LINE`)                              |

### Notable Tool Parameters

| Tool           | Parameter             | Type   | Description                                                   |
| :------------- | :-------------------- | :----- | :------------------------------------------------------------ |
| `analyze`      | `boundary_violations` | bool   | Convenience alias for `issue_types: ["boundary-violations"]`  |
| `find_dupes`   | `changed_since`       | string | Only report duplication in files changed since a git ref      |
| `project_info` | `entry_points`        | bool   | Request detected entry points                                 |
| `project_info` | `files`               | bool   | Request all discovered source files                           |
| `project_info` | `plugins`             | bool   | Request active framework plugins                              |
| `project_info` | `boundaries`          | bool   | Request architecture boundary zones and rules                 |
| `analyze`      | `group_by`            | string | Group output by `owner`, `directory`, `package`, or `section` |

### Structured Actions in Tool Responses

All tools return structured `actions` arrays on every finding, enabling agents to programmatically apply fixes or suppressions:

- **Dead code** (`analyze`, `check_changed`): fix action (e.g., `remove-export`) + suppress action
- **Health** (`check_health`, `audit`): `refactor-function`, `add-tests`, `increase-coverage`, `suppress-line`
- **Duplication** (`find_dupes`, `audit`): `extract-shared` + suppress actions on clone families
- **Audit** (`audit`): inherits actions from all three sub-analyses

## Combined Output from Bare `fallow`

Running bare `fallow` (no subcommand) executes all analyses in one pass and returns a combined JSON object:

```bash
fallow --format json
```

This is the most efficient way for agents to get a full picture of the codebase in a single call.

## CLI vs MCP: When to Use Which

|                | CLI                                                | MCP                                  |
| :------------- | :------------------------------------------------- | :----------------------------------- |
| **Works with** | Any agent that can run shell commands              | Agents with MCP support              |
| **Setup**      | None (just install fallow)                         | MCP server configuration needed      |
| **Output**     | Any format (JSON, SARIF, human, compact, markdown) | JSON only (structured)               |
| **Best for**   | Universal compatibility, CI-like workflows         | Typed tool calling, agent frameworks |

## Environment Variables

| Variable              | Description                                                                                                                                   |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `FALLOW_BIN`          | Path to the fallow CLI binary. The MCP server checks, in order: this env var, a sibling binary next to `fallow-mcp`, then `fallow` in `PATH`. |
| `FALLOW_TIMEOUT_SECS` | Subprocess timeout in seconds (default: `120`). Increase for very large codebases.                                                            |

## Error Handling

The MCP server returns structured JSON errors when the underlying CLI fails:

- **Exit code 1**: treated as success (issues found, not an error). The full JSON output is returned.
- **Exit code 2+**: the server passes through the CLI's structured JSON error from stdout when available.
- **Subprocess timeout**: if the CLI does not exit within `FALLOW_TIMEOUT_SECS`, the server kills the process and returns a timeout error.

## Installation

Install the MCP server with:

```bash
cargo install fallow-mcp
```

Or grab a binary from [GitHub Releases](https://github.com/fallow-rs/fallow/releases).

## Architecture

The MCP server is a thin subprocess wrapper. All analysis logic stays in the CLI binary.

```
AI Agent → MCP Server (fallow-mcp) → CLI Binary (fallow) → Results (JSON)
```

- CLI and MCP always produce identical results
- Any fallow CLI update automatically improves MCP
- Install with `cargo install fallow-mcp` or grab a binary from GitHub Releases

## References

- [Fallow Documentation](https://docs.fallow.tools/)
- [MCP Specification](https://modelcontextprotocol.io)
- [CI Integration](https://docs.fallow.tools/integrations/ci)
- [VS Code Extension](https://docs.fallow.tools/integrations/vscode)
- [Agent Skills](https://docs.fallow.tools/integrations/agent-skills)