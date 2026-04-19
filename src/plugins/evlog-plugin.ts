/**
 * Custom Elysia plugin for request/response logging using evlog.
 * Provides request lifecycle logging and error tracking without evlog/elysia.
 *
 * @module plugins/evlog-plugin
 */

import type { Elysia, Handler, ErrorHandler } from "elysia";
import type { DrainContext } from "evlog";
import { apiLogger } from "~/lib/logger";
import { drain } from "~/config/evlog";

/**
 * Plugin options for custom evlog integration.
 */
export interface EvlogPluginOptions {
  /** Log request details (method, path, status) */
  logRequests?: boolean;
  /** Log request timing */
  logTiming?: boolean;
  /** Log errors with full context */
  logErrors?: boolean;
  /** Custom drain function (defaults to configured drain) */
  drainFn?: (ctx: DrainContext | DrainContext[]) => Promise<void>;
  /** Skip logging for certain paths */
  excludePaths?: string[];
}

/**
 * Creates a custom Elysia plugin for evlog integration.
 * Logs requests, responses, timing, and errors using evlog drain.
 *
 * @param options - Plugin configuration
 * @returns Elysia plugin
 *
 * @example
 * // Basic usage
 * app.use(evlogPlugin())
 *
 * // Custom configuration
 * app.use(evlogPlugin({
 *   logRequests: true,
 *   logTiming: true,
 *   logErrors: true,
 *   excludePaths: ['/health', '/metrics']
 * }))
 */
export function evlogPlugin(options: EvlogPluginOptions = {}) {
  const {
    logRequests = true,
    logTiming = true,
    logErrors = true,
    drainFn = drain,
    excludePaths = [],
  } = options;

  /**
   * Check if path should be excluded from logging.
   */
  const isExcluded = (path: string): boolean => {
    return excludePaths.some((excluded) => path.startsWith(excluded));
  };

  /**
   * Build evlog context from request.
   */
  const buildRequestContext = (
    method: string,
    requestPath: string,
    status?: number,
    duration?: number,
  ): DrainContext => {
    const context = {
      event: status && status >= 400 ? "request_error" : "request",
      method,
      path: requestPath,
      ...(status && { status }),
      ...(duration && { duration }),
      timestamp: new Date().toISOString(),
    };

    return context as unknown as DrainContext;
  };

  /**
   * Build error context for evlog.
   */
  const buildErrorContext = (
    method: string,
    requestPath: string,
    err: Error,
    duration?: number,
  ): DrainContext => {
    const context = {
      event: "error",
      method,
      path: requestPath,
      error: err.message,
      stack: err.stack,
      ...(duration && { duration }),
      timestamp: new Date().toISOString(),
    };

    return context as unknown as DrainContext;
  };

  return (app: Elysia): Elysia => {
    let startTime: number;

    /**
     * Before request handler - log incoming requests.
     */
    const onBeforeHandle: Handler = ({ path, request }) => {
      if (!logRequests || !path || isExcluded(path)) return;

      const method = request?.method || "UNKNOWN";
      const requestPath = path || "/unknown";

      startTime = Date.now();

      const context = buildRequestContext(method, requestPath);

      // Log to console for debugging
      apiLogger.debug(`→ ${method} ${requestPath}`);

      // Send to evlog drain
      drainFn(context).catch((err) => {
        console.error("Evlog drain error:", err);
      });
    };

    /**
     * After response handler - log responses with timing.
     */
    const onAfterHandle: Handler = ({ path, request }) => {
      if (!logTiming || !path || isExcluded(path)) return;

      const duration = Date.now() - startTime;
      const httpRequest = request as Request;
      const method = httpRequest?.method || "UNKNOWN";
      const requestPath = path || "/unknown";

      // Get status from response - it could be Response or Request
      let status = 0;
      if (request) {
        const req = request as unknown as Record<string, unknown>;
        if (typeof req.status === "number") {
          status = req.status;
        }
      }

      const context = buildRequestContext(method, requestPath, status, duration);

      // Log to console
      apiLogger.debug(`← ${method} ${requestPath} ${status} ${duration}ms`);

      // Send to evlog drain
      drainFn(context).catch((err) => {
        console.error("Evlog drain error:", err);
      });
    };

    /**
     * Error handler - log errors with full context.
     */
    const onError: ErrorHandler = ({ path, error, request }) => {
      if (!logErrors || !path) return;

      const duration = Date.now() - startTime;
      const method = (request as Request)?.method || "UNKNOWN";
      const requestPath = path || "/unknown";
      const err = error instanceof Error ? error : new Error(String(error));

      const context = buildErrorContext(method, requestPath, err, duration);

      // Log to console
      apiLogger.error(`${method} ${requestPath} - ${err.message}`, err);

      // Send to evlog drain
      drainFn(context).catch((drainErr) => {
        console.error("Evlog drain error:", drainErr);
      });
    };

    return app.onBeforeHandle(onBeforeHandle).onAfterHandle(onAfterHandle).onError(onError);
  };
}

/**
 * Creates an evlog ingestion endpoint for client-side logs.
 *
 * @param options - Plugin options
 * @returns Elysia plugin
 *
 * @example
 * app.use(evlogIngestEndpoint())
 */
export function evlogIngestEndpoint(options: EvlogPluginOptions = {}) {
  const { drainFn = drain } = options;

  return (app: Elysia): Elysia => {
    app.post(
      "/_evlog/ingest",
      async ({ request }: { request: Request }) => {
        try {
          const batch = (await request.json()) as DrainContext[];

          for (const ctx of batch) {
            apiLogger.debug("Browser event", { event: ctx.event });
          }

          await drainFn(batch);

          return new Response(null, { status: 204 });
        } catch (err) {
          apiLogger.error("Evlog ingest error", err as Error);
          return new Response(null, { status: 204 });
        }
      },
      {
        detail: {
          summary: "Ingest browser logs",
          description: "Endpoint for ingesting logs from the browser",
          tags: ["api", "telemetry"],
        },
      },
    );

    return app;
  };
}