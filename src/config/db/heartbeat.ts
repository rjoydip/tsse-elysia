/**
 * Database heartbeat probe utilities.
 * Provides a lightweight read-only liveness check for status monitoring endpoints.
 */

import { getDatabasePools, getDatabasePoolConfigs, type DatabaseType } from "./index";
import type { Client } from "@libsql/client";

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
  databaseType?: DatabaseType;
  pools: PoolHealthStatus[];
}

/**
 * Executes a database heartbeat query based on database type.
 * Uses `SELECT 1` to verify read access without mutating application state.
 */
export async function getDatabaseHeartbeat(): Promise<DatabaseHeartbeat> {
  const startedAt = Date.now();
  const pools = getDatabasePools();

  try {
    // Check SQLite heartbeat using libSQL client
    const sqliteClient = pools.sqlite as Client | undefined;
    if (sqliteClient) {
      const result = await sqliteClient.execute({ sql: "SELECT 1 AS ok", args: [] });
      const row = result.rows?.[0] as { ok?: number } | undefined;
      if (!row || row.ok !== 1) {
        return {
          status: "unhealthy",
          latencyMs: null,
          timestamp: new Date().toISOString(),
          detail: "Database heartbeat query returned unexpected result",
          databaseType: "sqlite",
          pools: [
            {
              name: "sqlite",
              role: "primary",
              healthy: false,
              latencyMs: null,
              error: "Query returned unexpected result",
            },
          ],
        };
      }

      return {
        status: "healthy",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        detail: "SQLite heartbeat query succeeded",
        databaseType: "sqlite",
        pools: [
          {
            name: "sqlite",
            role: "primary",
            healthy: true,
            latencyMs: Date.now() - startedAt,
          },
        ],
      };
    }

    // Check PostgreSQL heartbeat
    const pgPrimary = pools.primary;
    if (!pgPrimary) {
      return {
        status: "unhealthy",
        latencyMs: null,
        timestamp: new Date().toISOString(),
        detail: "PostgreSQL primary pool is not initialized",
        databaseType: "postgres",
        pools: [],
      };
    }

    const poolConfigs = getDatabasePoolConfigs();
    const poolHealthResults: PoolHealthStatus[] = [];

    // Check primary pool
    try {
      const primaryStart = Date.now();
      const primaryResult = await pgPrimary.query("SELECT 1 AS ok");
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
      databaseType: "postgres",
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