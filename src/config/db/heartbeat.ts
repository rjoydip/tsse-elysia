/**
 * Database heartbeat probe utilities.
 * Provides a lightweight read-only liveness check for status monitoring endpoints.
 */

import { getDatabasePools, getDatabasePoolConfigs } from "./index";

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

    // Check primary pool
    try {
      const primaryStart = Date.now();
      const primaryResult = await pools.primary.query("SELECT 1 AS ok");
      const pRows = primaryResult.rows as Array<{ ok?: number }>;
      poolHealthResults.push({
        name: "primary",
        role: "primary",
        healthy: pRows[0]?.ok === 1,
        latencyMs: Date.now() - primaryStart,
      });
    } catch (error) {
      poolHealthResults.push({
        name: "primary",
        role: "primary",
        healthy: false,
        latencyMs: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Check all replica pools dynamically
    for (let i = 0; i < pools.replicas.length; i++) {
      const replica = pools.replicas[i];
      const config = poolConfigs.find((c) => c.role === "replica" && c.name === `replica-${i + 1}`);

      try {
        const replicaStart = Date.now();
        const replicaResult = await replica.query("SELECT 1 AS ok");
        const rRows = replicaResult.rows as Array<{ ok?: number }>;
        poolHealthResults.push({
          name: config?.name || `replica-${i + 1}`,
          role: "replica",
          healthy: rRows[0]?.ok === 1,
          latencyMs: Date.now() - replicaStart,
        });
      } catch (error) {
        poolHealthResults.push({
          name: config?.name || `replica-${i + 1}`,
          role: "replica",
          healthy: false,
          latencyMs: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
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
 * Uses db0 for a lightweight SELECT 1 query.
 */
async function checkViaDb0(startedAt: number): Promise<DatabaseHeartbeat> {
  try {
    const { getDb0 } = await import("./db0");
    const db0 = await getDb0();
    const queryStart = Date.now();
    await db0.exec("SELECT 1");
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