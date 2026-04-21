/**
 * Monitoring plugin for periodic health checks.
 * Uses elysia-cron to run health probes and store results in the database.
 * Records status, latency, and errors for the status dashboard.
 */

import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { db, schema } from "~/lib/db";
import { getDatabaseHeartbeat } from "~/lib/db/heartbeat";
import { PORT, HOST } from "~/config";
import { logger } from "~/lib/logger";
import { monitoringConfig } from "~/config";

/**
 * Health check results for a single service.
 */
interface HealthCheckResult {
  name: string;
  status: "up" | "down" | "degraded";
  latencyMs: number | null;
  error?: string;
}

/**
 * Executes a health check for a local API endpoint.
 *
 * @param name - Service name for recording
 * @param path - API path to probe
 * @returns Health check result with latency and status
 */
async function probeApi(name: string, path: string): Promise<HealthCheckResult> {
  const url = `http://${HOST}:${PORT}${path}`;
  const start = Date.now();

  try {
    const response = await fetch(url, { method: "GET" });
    const latencyMs = Date.now() - start;

    return {
      name,
      status: response.ok ? "up" : "down",
      latencyMs,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      name,
      status: "down",
      latencyMs: null,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Runs a complete health check suite for all monitored services.
 * Probes API, database, and Cache layers.
 *
 * @returns Array of health check results for all services
 */
async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // 1. Core API
  results.push(await probeApi("Core API", "/api/health"));

  // 2. Auth API
  results.push(await probeApi("Auth API", "/api/auth/health"));

  // 3. Realtime API
  results.push(await probeApi("Realtime API", "/api/realtime/health"));

  // 4. MCP API
  results.push(await probeApi("MCP API", "/api/mcp/health"));

  // 5. Database
  try {
    const dbHeartbeat = await getDatabaseHeartbeat();
    results.push({
      name: "Database",
      status: dbHeartbeat.status === "healthy" ? "up" : "down",
      latencyMs: dbHeartbeat.latencyMs,
      error: dbHeartbeat.status === "healthy" ? undefined : dbHeartbeat.detail,
    });
  } catch (err) {
    results.push({
      name: "Database",
      status: "down",
      latencyMs: null,
      error: err instanceof Error ? err.message : "Database probe failed",
    });
  }

  // 6. Cache (probe via heartbeat endpoint for consistent latency measurement)
  results.push(await probeApi("Cache", "/api/cache/heartbeat"));

  return results;
}

/**
 * Monitoring plugin factory.
 * Configures the cron job for periodic status recording.
 *
 * @returns Elysia plugin instance
 */
export const monitoringPlugin = new Elysia({ name: "monitoring" }).use(
  cron({
    name: "heartbeat",
    pattern: monitoringConfig.heartbeatPattern,
    async run() {
      logger.info("[Monitoring] Running scheduled health checks...");

      try {
        const results = await runHealthChecks();
        const timestamp = new Date();

        // Batch insert results into the database
        const entries = results.map((result) => ({
          serviceName: result.name,
          status: result.status,
          latencyMs: result.latencyMs,
          error: result.error,
          timestamp,
        }));

        await db.insert(schema.serviceHealth).values(entries);

        logger.info(`[Monitoring] Successfully recorded health for ${results.length} services`);
      } catch (err) {
        logger.error(
          "[Monitoring] Failed to record health checks:",
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    },
  }),
);