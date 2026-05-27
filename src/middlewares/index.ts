/**
 * Composed middleware that combines all security and utility middlewares.
 * Centralizes all middleware configuration for easy application to Elysia.
 *
 * Includes:
 * - CORS headers (basic and credentials)
 * - Security headers (Helmet)
 * - OpenAPI documentation
 * - Rate limiting
 * - OpenTelemetry tracing
 * - Static file serving
 */

import { Elysia, file } from "elysia";
import type { TraceHandler } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { APP_NAME } from "~/config";
import { cors, corsWithCredentials } from "./cors";
import { helmet } from "./helmet";
import { rateLimitMiddleware } from "./rate-limit";
import { apiLogger } from "~/lib/logger";

/**
 * Request trace handler for monitoring performance at each pipeline stage.
 * Adds timing information to help identify slow requests.
 *
 * @example
 * // Add to Elysia app:
 * app.use(traceFn)
 */
export const traceFn: TraceHandler = async ({
  onBeforeHandle,
  onAfterHandle,
  onError,
  onHandle,
  set,
}) => {
  // Track time spent in beforeHandle hook (validation, auth checks)
  onBeforeHandle(({ begin, onStop }) => {
    onStop(({ end }) => {
      const duration =
        typeof begin === "number" && typeof end === "number" ? (end - begin).toFixed(4) : "0.00";
      apiLogger.debug(`BeforeHandle took ${duration} ms`);
    });
  });

  // Track time spent in afterHandle hook (response transformation)
  onAfterHandle(({ begin, onStop }) => {
    onStop(({ end }) => {
      const duration =
        typeof begin === "number" && typeof end === "number" ? (end - begin).toFixed(4) : "0.00";
      apiLogger.debug(`AfterHandle took ${duration} ms`);
    });
  });

  // Track error handling time and log errors with duration
  onError(({ begin, onStop }) => {
    onStop(({ end, error }) => {
      const elapsed =
        typeof begin === "number" && typeof end === "number" ? (end - begin).toFixed(4) : "0.00";
      set.headers["X-Elapsed"] = elapsed;
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        apiLogger.error(`Error: ${errorMessage}, ${elapsed} ms`);
      }
    });
  });

  // Track total request handling time
  onHandle((traceContext) => {
    const { onStop } = traceContext;
    onStop(({ elapsed }) => {
      const elapsedTime = typeof elapsed === "number" ? elapsed.toFixed(4) : "0.00";
      set.headers["X-Elapsed"] = elapsedTime;
      apiLogger.debug(`Trace took ${elapsedTime} ms`);
    });
  });
};

/**
 * Centralized error handler for consistent API error responses.
 * Sanitizes error messages in production to prevent information leakage.
 *
 * @param code - Elysia error code (e.g., 'NOT_FOUND', 'INTERNAL_SERVER_ERROR')
 * @param error - The original error object
 * @returns JSON response with appropriate status code
 *
 * @example
 * // Add to Elysia app:
 * app.use(errorFn)
 * // Or use as onError handler:
 * .onError(errorFn)
 */
export const errorFn = ({ code, error }: any) => {
  try {
    // Determine if running in production to control error detail exposure
    const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production";

    // Sanitize error message: show full details in dev, generic message in prod
    const errorMessage = isProduction
      ? "An unexpected error occurred"
      : error instanceof Error
        ? error.message
        : String(error);

    // Format response based on error type
    const responseBody =
      code === "NOT_FOUND"
        ? JSON.stringify({ error: "Endpoint not found" })
        : JSON.stringify({ error: errorMessage });

    // Return appropriate status code (404 for not found, 500 for other errors)
    return new Response(responseBody, {
      status: code === "NOT_FOUND" ? 404 : 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch {
    // Last-resort fallback if the error handler itself throws
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
};

/**
 * Options for composing middleware with custom configuration.
 */
type ComposedMiddlewareOptions = {
  OPENAPI_NAME: string;
};

/**
 * Creates a composed Elysia middleware with all security and utility features.
 *
 * @param options - Configuration options (e.g., OpenAPI name)
 * @returns Configured Elysia middleware instance
 *
 * @example
 * const app = new Elysia()
 *   .use(composedMiddleware({ OPENAPI_NAME: "My API" }))
 *   .listen(3000)
 */
export const composedMiddleware = (
  { OPENAPI_NAME }: ComposedMiddlewareOptions = {
    OPENAPI_NAME: APP_NAME,
  },
) =>
  new Elysia({ name: "composed-middleware" })
    // CORS for public endpoints
    .use(cors)
    // CORS with credentials for authenticated endpoints
    .use(corsWithCredentials)
    // Security headers
    .use(helmet)
    // OpenAPI documentation generation
    .use(
      openapi({
        /**
         * Serves the generated OpenAPI document and UI under the API prefix.
         *
         * Note:
         * - Since this middleware is mounted inside `apiRoutes` (which already has `prefix: /api`),
         *   this becomes available at `/api/reference`.
         */
        path: "/reference",
        documentation: {
          info: {
            title: `${OPENAPI_NAME} Documentation`,
            version: "v0",
          },
          /**
           * Baseline server information to make the exported spec immediately usable.
           * Clients can override this with their own runtime base URL.
           */
          servers: [{ url: "/api", description: "Default API base path" }],
          /**
           * Shared security schemes so protected endpoints can declare auth requirements.
           *
           * Current usage:
           * - MCP key endpoints use `Authorization: Bearer <mcp_api_key>`.
           */
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                  "Bearer token. For MCP endpoints, this is the MCP API key (not a user JWT).",
              },
            },
          },
        },
      }),
    )
    // Rate limiting to prevent abuse
    .use(rateLimitMiddleware)
    // Serve favicon
    .get("/favicon.ico", file("../../public/favicon.svg"), {
      detail: {
        summary: "Get Favicon",
        description: "Returns the service favicon",
        tags: ["api", "assets"],
      },
    })
    // OpenTelemetry tracing for observability
    .use(
      opentelemetry({
        spanProcessors: [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              /*
               * URL for OTLP-compatible trace collector (e.g., Axiom, Grafana, Jaeger)
               * Uncomment and configure for production observability:
               * url: "https://api.axiom.co/v1/traces",
               * headers: {
               *   Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
               * },
               */
            }),
          ),
        ],
      }),
    );