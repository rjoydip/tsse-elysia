import { IconGithub, IconGmail } from "~/assets/brand-icons";
import { isServer } from "~/config";

/**
 * Supported social login providers.
 * Extend this type when adding new providers.
 */
export type AuthProviderId = "github" | "google";

/**
 * Metadata for a social login provider.
 */
export interface AuthProviderConfig {
  id: AuthProviderId;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
}

/**
 * Central configuration for social login providers.
 * This makes it easy to add/remove providers or change their display settings.
 *
 * @param env - Current environment variables
 * @returns List of configured providers
 */
export function getSocialProviders(env: any): AuthProviderConfig[] {
  // Use VITE_ flags on client, or check presence of secrets on server
  const githubEnabled = isServer
    ? !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
    : !!env.VITE_AUTH_GITHUB_ENABLED;

  const googleEnabled = isServer
    ? !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    : !!env.VITE_AUTH_GOOGLE_ENABLED;

  return [
    {
      id: "github",
      name: "GitHub",
      icon: IconGithub,
      enabled: githubEnabled,
    },
    {
      id: "google",
      name: "Google",
      icon: IconGmail, // Use Gmail icon for Google as requested
      enabled: googleEnabled,
    },
  ];
}

/**
 * Helper to get only enabled providers.
 *
 * @param env - Current environment variables
 * @returns List of enabled providers
 */
export function getEnabledSocialProviders(env: any): AuthProviderConfig[] {
  return getSocialProviders(env).filter((p) => p.enabled);
}