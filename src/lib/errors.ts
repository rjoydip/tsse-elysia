/**
 * Custom error class for application errors.
 * Provides consistent error handling across the app.
 *
 * @deprecated Use tagged errors from `src/lib/result.ts` (e.g., `DatabaseError`, `NotFoundError`, `ValidationError`)
 * along with `Result<T, E>` types from `better-result` for type-safe error handling.
 * Use `appErrorToResult` from `src/lib/result.ts` for backward compatibility.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Type guard to check if error is an AppError instance.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is a fetch Response error.
 * Handles both Response objects and error responses from fetch.
 */
export function isResponseError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Response) {
    return !error.ok;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if ("status" in err && typeof err.status === "number") {
      return err.status >= 400;
    }
    if ("response" in err && typeof err.response === "object" && err.response !== null) {
      const response = err.response as Record<string, unknown>;
      return (
        "status" in response &&
        typeof response.status === "number" &&
        (response.status as number) >= 400
      );
    }
  }

  return false;
}

/**
 * Extracts error message from unknown error types.
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
    if ("data" in err && typeof err.data === "object" && err.data !== null) {
      const data = err.data as Record<string, unknown>;
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }
  }

  return "Something went wrong!";
}

/**
 * Extracts status code from unknown error types.
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isAppError(error) && error.statusCode) {
    return error.statusCode;
  }

  if (error instanceof Response) {
    return error.status;
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if ("status" in err && typeof err.status === "number") {
      return err.status;
    }
    if ("response" in err && typeof err.response === "object" && err.response !== null) {
      const response = err.response as Record<string, unknown>;
      if ("status" in response && typeof response.status === "number") {
        return response.status;
      }
    }
  }

  return undefined;
}

/**
 * Checks if error indicates authentication failure (401).
 */
export function isAuthError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 401;
}

/**
 * Checks if error indicates forbidden access (403).
 */
export function isForbiddenError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 403;
}

/**
 * Checks if error indicates server error (5xx).
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status !== undefined && status >= 500 && status < 600;
}

/**
 * Checks if error indicates not found (404).
 */
export function isNotFoundError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 404;
}