/**
 * Evlog configuration with conditional adapter selection.
 * Uses FS adapter for development and OTLP for production.
 *
 * @module evlog
 */

import type { DrainContext } from "evlog";
import { createFsDrain } from "evlog/fs";
import { createOTLPDrain } from "evlog/otlp";
import { isProduction } from "./";
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
 * Combined drain that sends to multiple destinations.
 * Uses FS for local backup and OTLP for production observability.
 */
export const evlogDrain = async (ctx: DrainContext | DrainContext[]) => {
  const useOTLP = EVLOG_ADAPTER === "otlp" && OTLP_ENDPOINT;

  if (useOTLP) {
    const fsDrain = createFsDrain({
      dir: EVLOG_DIR,
      maxFiles: isProduction ? 30 : 7,
    });
    const otlpDrain = createOTLPDrain();

    await Promise.allSettled([fsDrain(ctx), otlpDrain(ctx)]);
    return;
  }

  const fsDrain = createFsDrain({
    dir: EVLOG_DIR,
    maxFiles: isProduction ? 30 : 7,
  });

  await fsDrain(ctx);
};

/**
 * Exported drain for use in framework configuration.
 */
export const drain = evlogDrain;