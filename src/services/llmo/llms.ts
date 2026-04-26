/**
 * LLMO LLMS.txt service.
 * Generates the AI system guidance file content.
 */

import { APP_NAME, GITHUB_REPO_URL } from "~/config";

export function getLlmsTxtContent(): string {
  const content = `# ${APP_NAME}

${APP_NAME} is a modern full-stack framework powered by Elysia, TanStack Start, and React.

## Overview

- Framework: Elysia + TanStack Start + React 19
- Language: TypeScript
- Database: SQLite / PostgreSQL with Drizzle ORM
- Authentication: Better Auth with OAuth and 2FA

## Key Features

- End-to-end type safety
- Server-side rendering
- Built-in authentication
- Type-safe database queries

## Documentation

- Getting Started: ${GITHUB_REPO_URL}
- API: /api/* routes

## Content Types

- Blog: /blog and /api/blog
- Docs: /docs and /api/docs
- Changelog: /changelog and /api/changelog
`;

  return content;
}