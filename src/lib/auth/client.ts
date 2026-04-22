/**
 * Better Auth client configuration for React.
 * Provides hooks and methods for client-side authentication operations.
 * Handles session management, sign-in, sign-up, and account operations.
 */

import { createAuthClient } from "better-auth/react";
import { BASE_URL } from "~/config";
import { encodePassword } from "~/lib/utils/encryption";

/**
 * Auth client instance configured for the application.
 * Uses React-specific hooks for session management and auth operations.
 * Base URL is determined from environment or window location.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : BASE_URL,
  redirect: `${BASE_URL}/dashboard`,
});

/**
 * Session hook for accessing current authentication state.
 * Returns session data, loading state, error, and refetch function.
 *
 * @example
 * const { data: session, isPending, error } = useSession();
 * if (isPending) return <Loading />;
 * if (!session) return <LoginPrompt />;
 */
export const { useSession } = authClient;

/**
 * Type for session data returned by useSession hook.
 * Contains user information and session metadata.
 */
export type SessionData = ReturnType<typeof useSession>["data"];

/**
 * Type for user data extracted from session.
 * Contains user profile information.
 */
export type UserData = SessionData extends { user: infer U } ? U : never;

/**
 * Sign in with email and password.
 * Creates a new session for the user on successful authentication.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with data and error objects
 */
export async function signInWithEmail(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
  });
}

/**
 * Sign up with email and password.
 * Creates a new user account and session.
 *
 * @param name - User's display name
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with data and error objects
 */
export async function signUpWithEmail(name: string, email: string, password: string) {
  try {
    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });
    return {
      data: result?.data ?? null,
      error: result?.error ?? null,
    };
  } catch (error) {
    /**
     * Better Auth may throw for non-2xx responses depending on transport/runtime.
     * Normalize to `{ data, error }` so UI can always show feedback.
     */
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      data: null,
      error: err,
    };
  }
}

/**
 * Sign out the current user.
 * Destroys the session and clears authentication state.
 *
 * @returns Promise that resolves when sign out is complete
 */
export async function signOut() {
  return authClient.signOut();
}

/**
 * Update user profile information.
 * Updates name, image, or other profile fields.
 *
 * @param data - Profile data to update
 * @returns Promise with data and error objects
 */
export async function updateUserProfile(data: { name?: string; image?: string }) {
  return authClient.updateUser(data);
}

/**
 * Change user password.
 * Requires current password for verification.
 *
 * @param currentPassword - User's current password
 * @param newPassword - New password to set
 * @returns Promise with data and error objects
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  return authClient.changePassword({
    currentPassword: await encodePassword(currentPassword),
    newPassword: await encodePassword(newPassword),
  });
}

/**
 * Change user email address.
 * Sends verification email to the new address.
 *
 * @param newEmail - New email address
 * @param callbackURL - URL to redirect after verification
 * @returns Promise with data and error objects
 */
export async function changeEmail(newEmail: string, callbackURL?: string) {
  return authClient.changeEmail({
    newEmail,
    callbackURL,
  });
}

/**
 * List all active sessions for the current user.
 * Returns session metadata including device, IP, and expiration.
 *
 * @returns Promise with sessions data and error objects
 */
export async function listSessions() {
  return authClient.listSessions();
}

/**
 * Revoke a specific session by token.
 * Invalidates the session and logs out the device.
 *
 * @param token - Session token to revoke
 * @returns Promise with data and error objects
 */
export async function revokeSession(token: string) {
  return authClient.revokeSession({
    token,
  });
}

/**
 * Revoke all sessions except the current one.
 * Forces re-authentication on all other devices.
 *
 * @returns Promise with data and error objects
 */
export async function revokeOtherSessions() {
  return authClient.revokeOtherSessions();
}

/**
 * Revoke all sessions including the current one.
 * Complete logout from all devices.
 * Uses revokeOtherSessions followed by signOut for complete cleanup.
 *
 * @returns Promise that resolves when all sessions are revoked
 */
export async function revokeAllSessions() {
  // First revoke all other sessions
  await authClient.revokeOtherSessions();
  // Then sign out current session
  return authClient.signOut();
}

/**
 * Send password reset email.
 * Sends an email with a reset link to the user's email address.
 *
 * @param email - User's email address
 * @returns Promise with data and error objects
 */
export async function sendPasswordReset(email: string) {
  const baseURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const response = await fetch(`${baseURL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { data: null, error };
  }

  return { data: await response.json(), error: null };
}

/**
 * Reset password using the reset token.
 * Sets a new password after verifying the reset token.
 *
 * @param newPassword - New password to set
 * @param token - Reset token from email
 * @returns Promise with data and error objects
 */
export async function resetPassword(newPassword: string, token: string) {
  const baseURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const response = await fetch(`${baseURL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      newPassword: await encodePassword(newPassword),
      token,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { data: null, error };
  }

  return { data: await response.json(), error: null };
}