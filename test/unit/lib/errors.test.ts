/**
 * Unit tests for src/lib/errors.ts
 * Tests AppError class and error utility functions.
 */

import { describe, test, expect } from "bun:test";
import {
  AppError,
  isAppError,
  isResponseError,
  getErrorMessage,
  getErrorStatus,
  isAuthError,
  isForbiddenError,
  isServerError,
  isNotFoundError,
} from "~/lib/errors";

describe("AppError", () => {
  test("should create instance with message", () => {
    const error = new AppError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("AppError");
    expect(error.statusCode).toBeUndefined();
    expect(error.code).toBeUndefined();
  });

  test("should create instance with statusCode", () => {
    const error = new AppError("Not found", 404);
    expect(error.statusCode).toBe(404);
  });

  test("should create instance with code", () => {
    const error = new AppError("Invalid", 400, "INVALID_INPUT");
    expect(error.code).toBe("INVALID_INPUT");
  });

  test("should create instance with data", () => {
    const data = { field: "email", value: "invalid" };
    const error = new AppError("Validation failed", 400, "VALIDATION", data);
    expect(error.data).toEqual(data);
  });

  test("should have stack trace", () => {
    const error = new AppError("Test");
    expect(error.stack).toBeDefined();
  });
});

describe("isAppError", () => {
  test("should return true for AppError instances", () => {
    const error = new AppError("Test");
    expect(isAppError(error)).toBe(true);
  });

  test("should return false for regular Error", () => {
    const error = new Error("Test");
    expect(isAppError(error)).toBe(false);
  });

  test("should return false for non-error values", () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe("isResponseError", () => {
  test("should return true for Response with !ok", () => {
    const response = new Response(null, { status: 404 });
    expect(isResponseError(response)).toBe(true);
  });

  test("should return false for Response with ok", () => {
    const response = new Response(null, { status: 200 });
    expect(isResponseError(response)).toBe(false);
  });

  test("should return true for object with status >= 400", () => {
    expect(isResponseError({ status: 500 })).toBe(true);
    expect(isResponseError({ status: 404 })).toBe(true);
  });

  test("should return false for object with status < 400", () => {
    expect(isResponseError({ status: 200 })).toBe(false);
    expect(isResponseError({ status: 302 })).toBe(false);
  });

  test("should check nested response object", () => {
    const error = { response: { status: 401 } };
    expect(isResponseError(error)).toBe(true);
  });

  test("should return false for non-error values", () => {
    expect(isResponseError(null)).toBe(false);
    expect(isResponseError("string")).toBe(false);
    expect(isResponseError({})).toBe(false);
  });
});

describe("getErrorMessage", () => {
  test("should extract message from AppError", () => {
    const error = new AppError("App error message");
    expect(getErrorMessage(error)).toBe("App error message");
  });

  test("should extract message from Error", () => {
    const error = new Error("Standard error");
    expect(getErrorMessage(error)).toBe("Standard error");
  });

  test("should extract message from string", () => {
    expect(getErrorMessage("String error")).toBe("String error");
  });

  test("should extract message from object with message", () => {
    expect(getErrorMessage({ message: "Object message" })).toBe("Object message");
  });

  test("should extract message from object.data.message", () => {
    const error = { data: { message: "Nested message" } };
    expect(getErrorMessage(error)).toBe("Nested message");
  });

  test("should return default message for unknown types", () => {
    expect(getErrorMessage(null)).toBe("Something went wrong!");
    expect(getErrorMessage(undefined)).toBe("Something went wrong!");
    expect(getErrorMessage(123)).toBe("Something went wrong!");
  });
});

describe("getErrorStatus", () => {
  test("should extract statusCode from AppError", () => {
    const error = new AppError("Not found", 404);
    expect(getErrorStatus(error)).toBe(404);
  });

  test("should extract status from Response", () => {
    const response = new Response(null, { status: 401 });
    expect(getErrorStatus(response)).toBe(401);
  });

  test("should extract status from object", () => {
    expect(getErrorStatus({ status: 500 })).toBe(500);
  });

  test("should extract status from nested response", () => {
    const error = { response: { status: 403 } };
    expect(getErrorStatus(error)).toBe(403);
  });

  test("should return undefined for unknown types", () => {
    expect(getErrorStatus(null)).toBeUndefined();
    expect(getErrorStatus({})).toBeUndefined();
    expect(getErrorStatus("string")).toBeUndefined();
  });

  test("should return undefined if AppError has no statusCode", () => {
    const error = new AppError("Test");
    expect(getErrorStatus(error)).toBeUndefined();
  });
});

describe("isAuthError", () => {
  test("should return true for 401 status", () => {
    const error = new AppError("Unauthorized", 401);
    expect(isAuthError(error)).toBe(true);
  });

  test("should return false for non-401 status", () => {
    const error = new AppError("Not found", 404);
    expect(isAuthError(error)).toBe(false);
  });

  test("should return false for non-error", () => {
    expect(isAuthError(null)).toBe(false);
  });
});

describe("isForbiddenError", () => {
  test("should return true for 403 status", () => {
    const error = new AppError("Forbidden", 403);
    expect(isForbiddenError(error)).toBe(true);
  });

  test("should return false for non-403 status", () => {
    const error = new AppError("Not found", 404);
    expect(isForbiddenError(error)).toBe(false);
  });
});

describe("isServerError", () => {
  test("should return true for 500 status", () => {
    const error = new AppError("Server error", 500);
    expect(isServerError(error)).toBe(true);
  });

  test("should return true for 503 status", () => {
    const error = { status: 503 };
    expect(isServerError(error)).toBe(true);
  });

  test("should return false for 404 status", () => {
    const error = new AppError("Not found", 404);
    expect(isServerError(error)).toBe(false);
  });

  test("should return false for 200 status", () => {
    expect(isServerError({ status: 200 })).toBe(false);
  });

  test("should return false for undefined status", () => {
    expect(isServerError({})).toBe(false);
  });
});

describe("isNotFoundError", () => {
  test("should return true for 404 status", () => {
    const error = new AppError("Not found", 404);
    expect(isNotFoundError(error)).toBe(true);
  });

  test("should return false for non-404 status", () => {
    const error = new AppError("Server error", 500);
    expect(isNotFoundError(error)).toBe(false);
  });

  test("should return false for non-error", () => {
    expect(isNotFoundError(null)).toBe(false);
  });
});