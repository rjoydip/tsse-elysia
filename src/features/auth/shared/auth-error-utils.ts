/**
 * Shared auth error utilities.
 * Extracted from sign-in-form.tsx and sign-up-form.tsx to reduce duplication.
 */

/**
 * Extracts a readable error message from unknown client/server error shapes.
 * Better Auth can return different payload structures depending on transport/runtime.
 *
 * @param error - Unknown error payload or thrown error
 * @returns Normalized raw message before UX-specific mapping
 */
export const extractAuthErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: string;
      error?: { message?: string } | string;
      body?: { message?: string };
    };
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
    if (typeof maybeError.error === "string") {
      return maybeError.error;
    }
    if (maybeError.error && typeof maybeError.error === "object") {
      const nestedError = maybeError.error as { message?: string };
      if (typeof nestedError.message === "string") {
        return nestedError.message;
      }
    }
    if (maybeError.body && typeof maybeError.body.message === "string") {
      return maybeError.body.message;
    }
  }
  return "An error occurred";
};

/**
 * Maps Better Auth errors to user-friendly toast messages.
 * Normalizes common duplicate-account responses from different runtimes/providers.
 *
 * @param errorMessage - Raw backend/client error text
 * @returns Human-friendly error message for auth failures
 */
export const getAuthErrorMessage = (errorMessage?: string): string => {
  const normalizedMessage = (errorMessage ?? "").toLowerCase();
  if (
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("user exists") ||
    normalizedMessage.includes("email has already been used")
  ) {
    return "User already exists. Use another email";
  }
  if (
    normalizedMessage.includes("invalid credentials") ||
    normalizedMessage.includes("invalid password")
  ) {
    return "Invalid email or password";
  }
  if (normalizedMessage.includes("too many requests")) {
    return "Too many attempts. Please try again later.";
  }
  return errorMessage || "An error occurred";
};