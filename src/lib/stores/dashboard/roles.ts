/**
 * Roles and permissions state management using TanStack Store.
 * Manages roles/permissions data for the roles feature.
 */

import { createStore } from "@tanstack/react-store";
import type { Role, Permission } from "~/features/roles/data/schema";

/**
 * Generic API fetch helper.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Roles state interface.
 */
interface RolesState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

/**
 * Permissions state interface.
 */
interface PermissionsState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial roles state.
 */
const initialRolesState: RolesState = {
  roles: [],
  loading: false,
  error: null,
};

/**
 * Initial permissions state.
 */
const initialPermissionsState: PermissionsState = {
  permissions: [],
  loading: false,
  error: null,
};

/**
 * TanStack Stores for roles and permissions data.
 */
export const rolesStore = createStore<RolesState>(initialRolesState);
export const permissionsStore = createStore<PermissionsState>(initialPermissionsState);

/**
 * Roles store actions.
 */
export const rolesActions = {
  /**
   * Set loading state.
   */
  setLoading: (isLoading: boolean) => {
    rolesStore.setState((state) => ({ ...state, loading: isLoading, error: null }));
  },

  /**
   * Fetch all roles from API.
   */
  fetchAll: async () => {
    rolesStore.setState((state) => ({ ...state, loading: true, error: null }));

    try {
      const result = await apiFetch<{ roles: Role[] }>("/api/roles");
      rolesStore.setState(() => ({
        roles: result.roles,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to fetch roles", error);
      rolesStore.setState((state) => ({
        ...state,
        loading: false,
        error: "Failed to load roles",
      }));
    }
  },
};

/**
 * Permissions store actions.
 */
export const permissionsActions = {
  /**
   * Set loading state.
   */
  setLoading: (isLoading: boolean) => {
    permissionsStore.setState((state) => ({ ...state, loading: isLoading, error: null }));
  },

  /**
   * Fetch all permissions from API.
   */
  fetchAll: async () => {
    permissionsStore.setState((state) => ({ ...state, loading: true, error: null }));

    try {
      const result = await apiFetch<{ permissions: Permission[] }>("/api/roles/permissions");
      permissionsStore.setState(() => ({
        permissions: result.permissions,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to fetch permissions", error);
      permissionsStore.setState((state) => ({
        ...state,
        loading: false,
        error: "Failed to load permissions",
      }));
    }
  },
};