/**
 * Unit tests for src/lib/result.ts
 * Tests tagged errors, utility functions, and Result type integration.
 */

import { describe, test, expect } from "bun:test";
import {
  Result,
  DatabaseError,
  NotFoundError,
  ValidationError,
  ConfigError,
  RateLimitError,
  DuplicateKeyError,
  appErrorToResult,
  isTaggedError,
  HTTP_STATUS_TO_ERROR_MAP,
} from "~/lib/result";
import { AppError } from "~/lib/errors";

describe("Tagged Errors", () => {
  test("DatabaseError should have correct _tag and properties", () => {
    const error = new DatabaseError({
      message: "Connection failed",
      query: "SELECT * FROM users",
      code: "ECONNREFUSED",
    });

    expect(error._tag).toBe("DatabaseError");
    expect(error.message).toBe("Connection failed");
    expect(error.query).toBe("SELECT * FROM users");
    expect(error.code).toBe("ECONNREFUSED");
  });

  test("NotFoundError should have correct _tag and properties", () => {
    const error = new NotFoundError({
      resource: "User",
      id: "user_123",
    });

    expect(error._tag).toBe("NotFoundError");
    expect(error.resource).toBe("User");
    expect(error.id).toBe("user_123");
  });

  test("ValidationError should have correct _tag and properties", () => {
    const error = new ValidationError({
      field: "email",
      message: "Invalid email format",
      value: "not-an-email",
    });

    expect(error._tag).toBe("ValidationError");
    expect(error.field).toBe("email");
    expect(error.message).toBe("Invalid email format");
    expect(error.value).toBe("not-an-email");
  });

  test("ConfigError should have correct _tag and properties", () => {
    const error = new ConfigError({
      message: "Missing required environment variable",
      key: "DATABASE_URL",
      value: undefined,
    });

    expect(error._tag).toBe("ConfigError");
    expect(error.key).toBe("DATABASE_URL");
  });

  test("RateLimitError should have correct _tag and properties", () => {
    const error = new RateLimitError({
      message: "Rate limit exceeded",
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    expect(error._tag).toBe("RateLimitError");
    expect(error.limit).toBe(100);
    expect(error.remaining).toBe(0);
  });

  test("DuplicateKeyError should have correct _tag and properties", () => {
    const error = new DuplicateKeyError({
      message: "Unique constraint violation",
      field: "email",
      value: "test@example.com",
    });

    expect(error._tag).toBe("DuplicateKeyError");
    expect(error.field).toBe("email");
    expect(error.value).toBe("test@example.com");
  });
});

describe("Result Type Integration", () => {
  test("should create Ok result", () => {
    const result = Result.ok(42);
    expect(result.status).toBe("ok");
    expect(result.value).toBe(42);
  });

  test("should create Err result", () => {
    const result = Result.err(new DatabaseError({ message: "Failed" }));
    expect(result.status).toBe("error");
    expect(result.error._tag).toBe("DatabaseError");
  });

  test("should use Result.try for sync operations", () => {
    const success = Result.try({
      try: () => JSON.parse('{"test": true}'),
      catch: (e) => new ValidationError({ field: "body", message: String(e) }),
    });

    expect(success.status).toBe("ok");
    if (Result.isOk(success)) {
      expect(success.value.test).toBe(true);
    }
  });

  test("should use Result.tryPromise for async operations", async () => {
    const success = await Result.tryPromise({
      try: async () => "async result",
      catch: (e) => new DatabaseError({ message: String(e) }),
    });

    expect(success.status).toBe("ok");
    if (Result.isOk(success)) {
      expect(success.value).toBe("async result");
    }
  });

  test("should chain Results with andThen", () => {
    const result = Result.ok(2).andThen((x) =>
      x > 0
        ? Result.ok(x * 2)
        : Result.err(new ValidationError({ field: "value", message: "Negative" })),
    );

    expect(result.status).toBe("ok");
    if (Result.isOk(result)) {
      expect(result.value).toBe(4);
    }
  });

  test("should short-circuit on error in andThen", () => {
    const errorResult = Result.err(new NotFoundError({ resource: "User", id: "123" }));
    const result = errorResult.andThen((x) => Result.ok(x * 2));

    expect(result.status).toBe("error");
    if (Result.isOk(result) === false && result.status === "error") {
      expect(result.error._tag).toBe("NotFoundError");
    }
  });

  test("should use match for pattern matching", () => {
    const okResult = Result.ok(42);
    const message = okResult.match({
      ok: (value) => `Got: ${value}`,
      err: (_error) => `Error`,
    });
    expect(message).toBe("Got: 42");

    const errResult = Result.err(new ValidationError({ field: "name", message: "Required" }));
    const errMessage = errResult.match({
      ok: (value) => `Got: ${value}`,
      err: (error) => `Error: ${error.message}`,
    });
    expect(errMessage).toBe("Error: Required");
  });
});

describe("appErrorToResult", () => {
  test("should convert 404 AppError to NotFoundError", () => {
    const appError = new AppError("User not found", 404, "NOT_FOUND", {
      resource: "User",
      id: "123",
    });

    const result = appErrorToResult(appError);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error._tag).toBe("NotFoundError");
    }
  });

  test("should convert 400 AppError to ValidationError", () => {
    const appError = new AppError("Invalid input", 400, "VALIDATION_ERROR", {
      field: "email",
    });

    const result = appErrorToResult(appError);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error._tag).toBe("ValidationError");
    }
  });

  test("should convert 422 AppError to ValidationError", () => {
    const appError = new AppError("Validation failed", 422, "UNPROCESSABLE");

    const result = appErrorToResult(appError);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error._tag).toBe("ValidationError");
    }
  });

  test("should convert 500 AppError to DatabaseError", () => {
    const appError = new AppError("Internal error", 500, "INTERNAL");

    const result = appErrorToResult(appError);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error._tag).toBe("DatabaseError");
    }
  });

  test("should convert AppError without statusCode to DatabaseError", () => {
    const appError = new AppError("Some error");

    const result = appErrorToResult(appError);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error._tag).toBe("DatabaseError");
    }
  });
});

describe("isTaggedError", () => {
  test("should return true for tagged errors", () => {
    const error = new NotFoundError({ resource: "User", id: "123" });
    expect(isTaggedError(error)).toBe(true);
  });

  test("should return true for DatabaseError", () => {
    const error = new DatabaseError({ message: "Failed" });
    expect(isTaggedError(error)).toBe(true);
  });

  test("should return false for regular Error", () => {
    const error = new Error("Regular error");
    expect(isTaggedError(error)).toBe(false);
  });

  test("should return false for non-error objects", () => {
    expect(isTaggedError({ message: "Not an error" })).toBe(false);
    expect(isTaggedError(null)).toBe(false);
    expect(isTaggedError(undefined)).toBe(false);
    expect(isTaggedError("string")).toBe(false);
  });

  test("should return false for AppError (not a tagged error)", () => {
    const appError = new AppError("Test error");
    expect(isTaggedError(appError)).toBe(false);
  });
});

describe("HTTP_STATUS_TO_ERROR_MAP", () => {
  test("should map 400 to ValidationError", () => {
    const ErrorClass = HTTP_STATUS_TO_ERROR_MAP[400];
    const error = new ErrorClass({ message: "test" });
    expect(error._tag).toBe("ValidationError");
  });

  test("should map 404 to NotFoundError", () => {
    const ErrorClass = HTTP_STATUS_TO_ERROR_MAP[404];
    const error = new ErrorClass({ message: "test" });
    expect(error._tag).toBe("NotFoundError");
  });

  test("should map 409 to DuplicateKeyError", () => {
    const ErrorClass = HTTP_STATUS_TO_ERROR_MAP[409];
    const error = new ErrorClass({ message: "test" });
    expect(error._tag).toBe("DuplicateKeyError");
  });

  test("should map 500 to DatabaseError", () => {
    const ErrorClass = HTTP_STATUS_TO_ERROR_MAP[500];
    const error = new ErrorClass({ message: "test" });
    expect(error._tag).toBe("DatabaseError");
  });
});