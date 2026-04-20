import type { Elysia } from "elysia";
import type { DrainContext, WideEvent } from "evlog";
import { rateLimit } from "elysia-rate-limit";
import { apiLogger } from "~/lib/logger";
import { drain } from "~/config/evlog";
import { APP_NAME, isProduction, isTest, isDev } from "~/config";

const environment = isProduction
  ? "production"
  : isTest
    ? "test"
    : isDev
      ? "development"
      : "unknown";

/**
 * Extended WideEvent for application-specific fields.
 */
export interface AppWideEvent extends WideEvent {
  event: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  error?: string;
  stack?: string;
}

/**
 * Application-specific DrainContext.
 */
export interface AppDrainContext extends DrainContext {
  event: AppWideEvent;
}

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
  /** Maximum batch size for ingest endpoint */
  maxBatchSize?: number;
}

/**
 * Build evlog context from request.
 */
function buildDrainContext(
  method: string,
  requestPath: string,
  status?: number,
  duration?: number,
): AppDrainContext {
  return {
    event: {
      timestamp: new Date().toISOString(),
      level: status && status >= 400 ? "error" : "info",
      service: APP_NAME,
      environment,
      event: status && status >= 400 ? "request_error" : "request",
      method,
      path: requestPath,
      ...(status && { status }),
      ...(duration && { duration }),
    },
    request: {
      method,
      path: requestPath,
    },
  };
}

/**
 * Creates a custom Elysia plugin for evlog integration.
 * Logs requests, responses, timing, and errors using evlog drain.
 *
 * @param options - Plugin configuration
 * @returns Elysia plugin
 */
export function evlogPlugin(options: EvlogPluginOptions = {}) {
  const {
    logRequests = true,
    logTiming = true,
    logErrors = true,
    drainFn = drain,
    excludePaths: rawExcludePaths = [],
  } = options;

  const excludePaths = Array.isArray(rawExcludePaths) ? rawExcludePaths : [];

  /**
   * Check if path should be excluded from logging.
   */
  const isExcluded = (path: string): boolean => {
    return excludePaths.some((excluded) => path.startsWith(excluded));
  };

  return (app: Elysia) => {
    return app
      .derive(() => ({ startTime: Date.now() }))
      .onBeforeHandle(({ path, request }) => {
        if (!logRequests || !path || isExcluded(path)) return;

        const method = request?.method || "UNKNOWN";
        const requestPath = path || "/unknown";

        const context = buildDrainContext(method, requestPath);

        // Log to console for debugging
        apiLogger.debug(`→ ${method} ${requestPath}`);

        // Send to evlog drain
        drainFn(context).catch((err) => {
          console.error("Evlog drain error:", err);
        });
      })
      .onAfterHandle(({ path, request, startTime }) => {
        if (!logTiming || !path || isExcluded(path)) return;

        const duration = Date.now() - (startTime as number);
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

        const context = buildDrainContext(method, requestPath, status, duration);

        // Log to console
        apiLogger.debug(`← ${method} ${requestPath} ${status} ${duration}ms`);

        // Send to evlog drain
        drainFn(context).catch((err) => {
          console.error("Evlog drain error:", err);
        });
      })
      .onError(({ path, error, request, startTime }) => {
        if (!logErrors || !path) return;

        const duration = startTime ? Date.now() - (startTime as number) : 0;
        const method = (request as Request)?.method || "UNKNOWN";
        const requestPath = path || "/unknown";
        const err = error instanceof Error ? error : new Error(String(error));

        const context = buildDrainContext(method, requestPath, 500, duration);
        context.event.event = "error";
        context.event.error = err.message;
        context.event.stack = err.stack;

        // Log to console
        apiLogger.error(`${method} ${requestPath} - ${err.message}`, err);

        // Send to evlog drain
        drainFn(context).catch((drainErr) => {
          console.error("Evlog drain error:", drainErr);
        });
      });
  };
}

/**
 * Creates an evlog ingestion endpoint for client-side logs.
 *
 * @param options - Plugin options
 * @returns Elysia plugin
 */
export function evlogIngestEndpoint(options: EvlogPluginOptions = {}) {
  const { drainFn = drain, maxBatchSize = 1000 } = options;

  return (app: Elysia) => {
    return app
      .use(
        rateLimit({
          duration: 60000,
          max: 10, // 10 requests per minute for log ingestion
        }),
      )
      .post(
        "/_evlog/ingest",
        async ({ request }: { request: Request }) => {
          try {
            const body = await request.json();

            if (!Array.isArray(body)) {
              return new Response(JSON.stringify({ error: "Batch must be an array" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }

            if (body.length > maxBatchSize) {
              return new Response(
                JSON.stringify({ error: `Batch size exceeds limit of ${maxBatchSize}` }),
                {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }

            const batch = body as DrainContext[];

            for (const ctx of batch) {
              apiLogger.debug("Browser event", { event: (ctx as any).event });
            }

            await drainFn(batch);

            return new Response(null, { status: 204 });
          } catch (err) {
            apiLogger.error("Evlog ingest error", err as Error);
            return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
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