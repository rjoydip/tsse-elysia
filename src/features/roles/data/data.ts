/**
 * Static data and constants for roles and permissions feature.
 */

import { Shield, Key } from "lucide-react";

/**
 * Permission display name colors for badges.
 */
export const permissionCallTypes = new Map<string, string>([
  ["create", "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"],
  ["read", "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300"],
  ["update", "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"],
  ["delete", "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"],
]);

/**
 * Icons for tabs.
 */
export const rolesIcon = Shield;
export const permissionsIcon = Key;