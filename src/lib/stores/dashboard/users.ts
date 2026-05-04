/**
 * User management state management using TanStack Store.
 * Manages users data for the users feature.
 */

import { createStore, useStore } from "@tanstack/react-store";
import type { User, UserRole, UserStatus } from "~/features/users/data/schema";

/**
 * Users state interface.
 */
interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Module-level pagination state for non-React access.
 */
let currentPagination = {
  limit: 50,
  offset: 0,
  total: 0,
};

/**
 * Initial users state.
 */
const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  pagination: currentPagination,
};

/**
 * TanStack Store for users data.
 */
export const usersStore = createStore<UsersState>(initialState);

/**
 * Fetch users with pagination offset and limit.
 */
export async function fetchUsersWithPagination(offset: number, limit: number) {
  await usersActions.fetchAllWithPagination(offset, limit);
}

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
 * Users store actions for CRUD operations.
 */
export const usersActions = {
  /**
   * Set loading state.
   */
  setLoading: (isLoading: boolean) => {
    usersStore.setState((state) => ({
      ...state,
      loading: isLoading,
      error: null,
    }));
  },

  /**
   * Clear error state.
   */
  clearError: () => {
    usersStore.setState((state) => ({ ...state, error: null }));
  },

  /**
   * Update users list.
   */
  setUsers: (users: User[]) => {
    usersStore.setState((state) => ({
      ...state,
      users,
    }));
  },

  /**
   * Set pagination info.
   */
  setPagination: (pagination: UsersState["pagination"]) => {
    usersStore.setState((state) => ({
      ...state,
      pagination,
    }));
  },

  /**
   * Fetch all users from API.
   */
  fetchAll: async (filters?: { role?: UserRole; status?: UserStatus; search?: string }) => {
    usersStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const params = new URLSearchParams();
      if (filters?.role) params.set("role", filters.role);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);

      const url = `/api/users${params.toString() ? `?${params.toString()}` : ""}`;
      const result = await apiFetch<{ users: User[]; pagination: UsersState["pagination"] }>(url);

      usersStore.setState(() => ({
        users: result.users,
        loading: false,
        error: null,
        pagination: result.pagination,
      }));
    } catch (error) {
      console.error("Failed to fetch users", error);
      usersStore.setState((state) => ({
        ...state,
        loading: false,
        error: "Failed to load users",
      }));
    }
  },

  /**
   * Fetch users with pagination offset and limit.
   */
  fetchAllWithPagination: async (offset: number, limit: number) => {
    currentPagination = { ...currentPagination, offset, limit };

    usersStore.setState((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    try {
      const params = new URLSearchParams();
      params.set("offset", String(offset));
      params.set("limit", String(limit));

      const url = `/api/users?${params.toString()}`;
      const result = await apiFetch<{ users: User[]; pagination: UsersState["pagination"] }>(url);

      currentPagination = result.pagination;

      usersStore.setState(() => ({
        users: result.users,
        loading: false,
        error: null,
        pagination: result.pagination,
      }));
    } catch (error) {
      console.error("Failed to fetch users", error);
      usersStore.setState((state) => ({
        ...state,
        loading: false,
        error: "Failed to load users",
      }));
    }
  },
};

/**
 * Get current pagination state (for non-React access).
 */
export function getCurrentPagination() {
  return currentPagination;
}

/**
 * Custom hook to use users store.
 */
export function useUsersStore() {
  return useStore(usersStore);
}