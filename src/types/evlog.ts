/**
 * Evlog type definitions for user identity and session context.
 * Used for log enrichment with Better Auth integration.
 *
 * @module types/evlog
 */

/**
 * User identity information from Better Auth session.
 */
export interface EvlogUser {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  name?: string;
  /** User's email address */
  email?: string;
  /** URL to user's avatar image */
  image?: string;
  /** Whether email has been verified */
  emailVerified?: boolean;
  /** Account creation timestamp */
  createdAt?: string;
}

/**
 * Session information from Better Auth session.
 */
export interface EvlogSession {
  /** Unique session identifier */
  id: string;
  /** Session expiration timestamp */
  expiresAt?: string;
  /** Client IP address */
  ipAddress?: string;
  /** Client user agent string */
  userAgent?: string;
  /** Session creation timestamp */
  createdAt?: string;
}

/**
 * Complete Better Auth session with user and session data.
 * Used for identity enrichment in logging.
 */
export interface EvlogAuthSession {
  /** User data from session */
  user: EvlogUser;
  /** Session metadata */
  session: EvlogSession;
}

/**
 * User context for logging enrichment.
 * Returned by getIdentity() for adding to log entries.
 */
export interface EvlogUserContext {
  /** Top-level user ID for adapters (e.g., PostHog distinct_id) */
  userId: string;
  /** Enriched user data */
  user: EvlogUser;
  /** Session metadata */
  session: EvlogSession;
}