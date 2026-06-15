/**
 * Database heartbeat probe utilities.
 * Provides a lightweight read-only liveness check for status monitoring endpoints.
 */

import type { Pool } from "pg";
import { sql } from "drizzle-orm";
import { dbLogger } from "~/lib/logger";
import { getDatabasePools, getDatabasePoolConfigs, db } from "./index";

/**
 * Individual pool status for heartbeat response.
 */
export interface PoolHealthStatus {
  name: string;
  role: "primary" | "replica";
  healthy: boolean;
  latencyMs?: number | null;
  error?: string;
}

/**
 * Checks a single PostgreSQL pool by executing SELECT 1 AS ok.
 */
async function checkPoolHealth(
  pool: Pool,
  name: string,
  role: "primary" | "replica",
): Promise<PoolHealthStatus> {
  const start = Date.now();
  try {
    const result = await pool.query("SELECT 1 AS ok");
    const rows = result.rows as Array<{ ok?: number }>;
    return {
      name,
      role,
      healthy: rows[0]?.ok === 1,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    dbLogger.warn("Pool health check failed", { name, role, error });
    return {
      name,
      role,
      healthy: false,
      latencyMs: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Heartbeat payload shape for database liveness checks.
 */
export interface DatabaseHeartbeat {
  status: "healthy" | "unhealthy";
  latencyMs: number | null;
  timestamp: string;
  detail: string;
  driver?: string;
  pools: PoolHealthStatus[];
}

/**
 * Executes a database heartbeat query based on connection type.
 * Uses `SELECT 1` to verify read access without mutating application state.
 */
export async function getDatabaseHeartbeat(): Promise<DatabaseHeartbeat> {
  const startedAt = Date.now();
  const pools = getDatabasePools();

  try {
    // When no pg Pool is available (PGlite or pg-proxy mode), use db0
    if (!pools.primary) {
      return checkViaDb0(startedAt);
    }

    // Check PostgreSQL heartbeat via primary pool
    const poolConfigs = getDatabasePoolConfigs();
    const poolHealthResults: PoolHealthStatus[] = [];

    poolHealthResults.push(await checkPoolHealth(pools.primary, "primary", "primary"));

    // Check all replica pools dynamically
    for (let i = 0; i < pools.replicas.length; i++) {
      const replica = pools.replicas[i];
      const config = poolConfigs.find((c) => c.role === "replica" && c.name === `replica-${i + 1}`);
      poolHealthResults.push(
        await checkPoolHealth(replica, config?.name || `replica-${i + 1}`, "replica"),
      );
    }

    // Determine overall status
    const allHealthy = poolHealthResults.every((p) => p.healthy);
    const healthyCount = poolHealthResults.filter((p) => p.healthy).length;
    const totalCount = poolHealthResults.length;

    let detail: string;
    if (allHealthy) {
      detail = `All ${totalCount} PostgreSQL pools are healthy`;
    } else if (healthyCount === 0) {
      detail = "All PostgreSQL pools are unhealthy";
    } else {
      detail = `${healthyCount}/${totalCount} PostgreSQL pools are healthy`;
    }

    return {
      status: allHealthy ? "healthy" : "unhealthy",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      detail,
      driver: "postgres",
      pools: poolHealthResults,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database heartbeat error";
    dbLogger.error("Database heartbeat failed", error instanceof Error ? error : undefined);
    return {
      status: "unhealthy",
      latencyMs: null,
      timestamp: new Date().toISOString(),
      detail: message,
      pools: [],
    };
  }
}

/**
 * Fallback heartbeat check for non-Pool drivers (PGlite, pg-proxy).
 *
 * Uses the existing Drizzle ORM db instance instead of creating a
 * separate db0 connection. This avoids dual-PGlite contention for
 * the same data directory — the main db is already initialized at
 * startup via initializeDatabase().
 */
async function checkViaDb0(startedAt: number): Promise<DatabaseHeartbeat> {
  try {
    const queryStart = Date.now();
    await db.execute(sql`SELECT 1 AS ok`);
    const latencyMs = Date.now() - queryStart;

    return {
      status: "healthy",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      detail: "Database heartbeat query succeeded",
      pools: [
        {
          name: "primary",
          role: "primary",
          healthy: true,
          latencyMs,
        },
      ],
    };
  } catch (error) {
    dbLogger.error("Database heartbeat query failed", error instanceof Error ? error : undefined);
    return {
      status: "unhealthy",
      latencyMs: null,
      timestamp: new Date().toISOString(),
      detail: error instanceof Error ? error.message : "Database heartbeat failed",
      pools: [
        {
          name: "primary",
          role: "primary",
          healthy: false,
          latencyMs: null,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}