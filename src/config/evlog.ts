/**
 * Evlog configuration with conditional adapter selection.
 * Uses FS adapter for development and OTLP for production.
 *
 * @module evlog
 */

import type { DrainContext } from "evlog";
import { createFsDrain } from "evlog/fs";
import { createOTLPDrain } from "evlog/otlp";
import { isProduction, isTest } from "./";
import { env } from "./env";

/**
 * Log directory for FS adapter.
 * Stores NDJSON log files in `.evlog/logs/`.
 */
const EVLOG_DIR = env.EVLOG_DIR;

/**
 * Environment variable for adapter selection.
 * Use "fs" for local files, "otlp" for external collector.
 */
const EVLOG_ADAPTER = env.EVLOG_ADAPTER;

/**
 * OTLP endpoint for production logging.
 * Comes from env config.
 */
const OTLP_ENDPOINT = env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "";

/**
 * Memoized drains for performance.
 */
let cachedFsDrain: ((ctx: DrainContext | DrainContext[]) => Promise<void>) | null = null;
let cachedOtlpDrain: ((ctx: DrainContext | DrainContext[]) => Promise<void>) | null = null;

/**
 * Gets or creates the FS drain.
 */
const getFsDrain = () => {
  if (!cachedFsDrain) {
    cachedFsDrain = createFsDrain({
      dir: EVLOG_DIR,
      maxFiles: isProduction ? 30 : 7,
    });
  }
  return cachedFsDrain;
};

/**
 * Gets or creates the OTLP drain.
 */
const getOtlpDrain = () => {
  if (!cachedOtlpDrain) {
    cachedOtlpDrain = createOTLPDrain();
  }
  return cachedOtlpDrain;
};

/**
 * Combined drain that sends to multiple destinations.
 * Uses FS for local backup and OTLP for production observability.
 */
export const evlogDrain = async (ctx: DrainContext | DrainContext[]) => {
  const useOTLP = EVLOG_ADAPTER === "otlp" && OTLP_ENDPOINT;

  if (useOTLP) {
    const fsDrain = getFsDrain();
    const otlpDrain = getOtlpDrain();

    await Promise.allSettled([fsDrain(ctx), otlpDrain(ctx)]);
    return;
  }

  const fsDrain = getFsDrain();
  await fsDrain(ctx);
};

/**
 * Exported drain for use in framework configuration.
 * In test mode, this is a no-op to prevent unhandled errors.
 */
export const drain = isTest ? async () => {} : evlogDrain;