import { getCurrentApiKey } from "../auth";
import { createErrorResponse } from "../tools/shared-utils";

/**
 * Gets the current API key and validates authentication.
 * @returns The API key if authenticated, or throws an error response
 */
export function getAuthenticatedApiKey(): {
  apiKey: ReturnType<typeof getCurrentApiKey>;
  isAuthenticated: boolean;
} {
  const apiKey = getCurrentApiKey();

  if (!apiKey) {
    return {
      apiKey: undefined,
      isAuthenticated: false,
    };
  }

  return {
    apiKey,
    isAuthenticated: true,
  };
}

/**
 * Checks if the API key is authenticated and returns an error response if not.
 * @returns Error response if not authenticated, null if authenticated
 */
export function requireAuthentication(): ReturnType<typeof createErrorResponse> | null {
  const apiKey = getCurrentApiKey();

  if (!apiKey) {
    return createErrorResponse("Authentication required");
  }

  return null;
}

/**
 * Checks if the API key has a user ID and returns an error response if not.
 * @returns Error response if not authenticated, null if authenticated
 */
export function requireUserId(): ReturnType<typeof createErrorResponse> | null {
  const apiKey = getCurrentApiKey();

  if (!apiKey?.userId) {
    return createErrorResponse("Authentication required");
  }

  return null;
}