/**
 * Status service.
 * Handles historical health record fetching.
 */

import { db, schema } from "~/config/db";
import { desc, gt } from "drizzle-orm";

export interface StatusHistoryRecord {
  serviceName: string;
  status: string;
  latencyMs: number;
  timestamp: Date;
}

export interface GetStatusHistoryOptions {
  hours?: number;
}

export async function getStatusHistory(
  options: GetStatusHistoryOptions = {},
): Promise<StatusHistoryRecord[]> {
  const hours = options.hours ?? 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const records = await db
    .select()
    .from(schema.serviceHealth)
    .where(gt(schema.serviceHealth.timestamp, cutoff))
    .orderBy(desc(schema.serviceHealth.timestamp));

  return records;
}