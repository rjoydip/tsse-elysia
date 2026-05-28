/**
 * App factory helpers for API contract tests.
 * Provides convenience wrappers around createApiRoutes()
 * for re-use across test files.
 */

import { createApiRoutes } from "~/routes/api/-app";

/**
 * Creates a fresh API application instance for testing.
 * Each call returns an isolated Elysia app so tests don't
 * share state through global singletons.
 *
 * @returns A fresh API routes instance
 */
export const createTestApp = () => createApiRoutes();

/**
 * Singleton API app instance for tests that don't require isolation.
 * Use when tests are read-only and don't mutate shared state.
 */
export const apiApp = createApiRoutes();