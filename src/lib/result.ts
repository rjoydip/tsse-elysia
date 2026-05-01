/**
 * Core Result type utilities using better-result library.
 * Provides type-safe error handling across all layers.
 */

// Re-export core better-result types and functions
export { Result, TaggedError, type Result as ResultType } from "better-result";

// Import for local use
import { Result, TaggedError } from "better-result";
import type { Result as ResultType } from "better-result";
import { AppError } from "./errors";

/**
 * Database operation error with context.
 * Used when Drizzle ORM or database queries fail.
 */
export class DatabaseError extends TaggedError("DatabaseError")<{
  message: string;
  query?: string;
  code?: string;
}>() {}

/**
 * Resource not found error.
 * Used when a requested resource does not exist.
 */
export class NotFoundError extends TaggedError("NotFoundError")<{
  resource: string;
  id: string;
}>() {}

/**
 * Validation error for input/data validation failures.
 * Used when request body or parameters fail validation.
 */
export class ValidationError extends TaggedError("ValidationError")<{
  field: string;
  message: string;
  value?: unknown;
}>() {}

/**
 * Configuration/Environment validation error.
 * Used when environment variables or config values are invalid.
 */
export class ConfigError extends TaggedError("ConfigError")<{
  message: string;
  key?: string;
  value?: unknown;
}>() {}

/**
 * Rate limit exceeded error.
 * Used when rate limiting triggers.
 */
export class RateLimitError extends TaggedError("RateLimitError")<{
  message: string;
  limit: number;
  remaining: number;
  reset: number;
}>() {}

/**
 * Duplicate key/constraint violation error.
 * Used for unique constraint violations in database.
 */
export class DuplicateKeyError extends TaggedError("DuplicateKeyError")<{
  message: string;
  field: string;
  value: string;
}>() {}

/**
 * Converts an AppError to a Result type.
 * Provides backward compatibility with existing error handling.
 *
 * @param appError - The AppError instance to convert
 * @returns A Result that is always an Err with appropriate tagged error
 */
export function appErrorToResult<E = DatabaseError | NotFoundError | ValidationError>(
  appError: AppError,
): ResultType<never, E> {
  // Map AppError to appropriate tagged error based on status code
  const statusCode = appError.statusCode;

  if (statusCode === 404) {
    return Result.err(
      new NotFoundError({
        resource: (appError.data?.resource as string) ?? "unknown",
        id: (appError.data?.id as string) ?? "unknown",
      }) as E,
    );
  }

  if (statusCode === 400 || statusCode === 422) {
    return Result.err(
      new ValidationError({
        field: (appError.data?.field as string) ?? "unknown",
        message: appError.message,
      }) as E,
    );
  }

  // Default to DatabaseError for server errors or unknown
  return Result.err(
    new DatabaseError({
      message: appError.message,
      code: appError.code,
    }) as E,
  );
}

/**
 * Type guard to check if a value is a tagged error instance.
 *
 * @param value - Value to check
 * @returns True if value is a TaggedError instance
 */
export function isTaggedError(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "_tag" in value &&
    typeof (value as Record<string, unknown>)._tag === "string"
  );
}

/**
 * Maps HTTP status codes to appropriate tagged errors.
 * Useful in controllers when converting errors to HTTP responses.
 * Note: This is a simplified map - controllers should handle specific error construction.
 */
export const HTTP_STATUS_TO_ERROR_MAP: Record<number, any> = {
  400: ValidationError,
  404: NotFoundError,
  409: DuplicateKeyError,
  500: DatabaseError,
};