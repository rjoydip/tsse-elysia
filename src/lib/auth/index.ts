/**
 * Authentication configuration and factory using Better Auth.
 * Provides email/password auth with database adapter for Drizzle ORM.
 * Uses Argon2id for secure password hashing with Bun native API when available.
 * This module should only be used on the server side.
 */

import { hash, type Options, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createError } from "evlog";
import { db, schema, getDatabaseType } from "~/lib/db";
import { env } from "~/config/env";
import type { SubscriptionTier } from "~/types/subscription";
import { isTest, sessionConfig } from "~/config";
import { authLogger } from "~/lib/logger";
import { decodePassword } from "~/lib/utils/encryption";

/**
 * Creates and configures the Better Auth instance.
 * Should only be called on the server side (database required).
 *
 * @returns Configured Better Auth instance
 * @throws Error if called in client-side context
 *
 * @example
 * const auth = createAuth();
 * // Use auth.api.signUp(), auth.api.signIn(), etc.
 */
export function createAuth() {
  // Ensure database is available - auth requires server-side execution
  if (!db) {
    throw createError({
      message: "Database not initialized - this module can only be used on the server",
      status: 500,
      why: "Database connection is not available",
      fix: "Ensure the database is initialized before using auth",
    });
  }

  // Argon2id hashing options for secure password storage
  // These values provide good security/performance balance
  const hashOpts: Options = {
    memoryCost: 65536, // 64 MiB - resistant to GPU cracking
    timeCost: 3, // 3 iterations - computational cost
    parallelism: 4, // 4 lanes - parallel processing
    outputLen: 32, // 32 bytes - hash output size
    algorithm: 2, // Argon2id - recommended variant
  };

  return betterAuth({
    // Database adapter using Drizzle ORM with dynamic provider based on env
    database: drizzleAdapter(db, {
      provider: getDatabaseType() === "postgres" ? "pg" : "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),

    // Generate OpenAPI documentation from auth routes
    plugins: [openAPI()],

    // Secret key for signing sessions and tokens
    secret: env.BETTER_AUTH_SECRET,

    // Base URL for auth endpoints (used in redirects, emails)
    baseURL: env.BETTER_AUTH_URL,

    // Email/password authentication configuration
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can enable for production
      password: {
        // Use Bun's native password API when available (faster), fallback to argon2
        hash: async (input: string) => {
          if (!input) {
            throw createError({
              message: "Password cannot be empty",
              status: 400,
              why: "Empty password provided",
              fix: "Provide a non-empty password",
            });
          }
          const decoded = await decodePassword(input);
          return await hash(decoded, hashOpts);
        },
        verify: async ({ password, hash }) => {
          const decoded = await decodePassword(password);
          return await verify(hash, decoded, hashOpts);
        },
      },
    },

    // Session configuration with caching for performance
    session: {
      expiresIn: sessionConfig.expiresIn,
      updateAge: sessionConfig.updateAge,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes - cache duration
      },
    },

    // Trusted origins for CORS - prevents CSRF attacks
    trustedOrigins: [env.BETTER_AUTH_URL, new URL(env.BETTER_AUTH_URL).origin],

    /**
     * Advanced runtime networking config for auth rate-limiting and audit metadata.
     * Ensures Better Auth can derive a client IP behind local proxies/reverse proxies.
     */
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
      },
    },

    // Error handler for auth API failures
    onAPIError: {
      onError: (error: unknown) => {
        authLogger.error(`Auth API error`, error as Error);
      },
    },

    // Logger configuration - disable in test environment to reduce noise in test output
    logger: {
      disabled: isTest,
    },
  });
}

/**
 * Cached auth instance - singleton pattern to avoid recreating on each call.
 * Better Auth instances are expensive to create (database connections).
 */
let _auth: ReturnType<typeof createAuth> | undefined;

/**
 * Gets or creates the auth instance.
 * Uses lazy initialization for performance.
 */
function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

/**
 * Proxy wrapper for auth instance.
 * Provides cleaner API access while maintaining lazy initialization.
 * Allows calling auth.api.* directly without function calls.
 *
 * @example
 * await auth.api.signIn.email({ email, password })
 * const session = await auth.api.getSession({ headers })
 */
export const auth = new Proxy({} as any, {
  get(_target, prop) {
    const authInstance = getAuth();
    return authInstance[prop as keyof typeof authInstance];
  },
});

// Type exports for use in route handlers and API responses
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

/**
 * Retrieves the subscription tier for a user.
 * Currently returns 'free' tier - can be extended to check database.
 *
 * @param _userId - User ID to look up (currently unused)
 * @returns Subscription tier based on user's plan
 */
export async function getUserSubscriptionTier(_userId: string): Promise<SubscriptionTier> {
  // TODO: Implement tier lookup from database
  // Would query subscriptions table to get actual tier
  return "free";
}