/**
 * Query Client Configuration
 * Centralized QueryClient instance for TanStack Query.
 */
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authActions } from "~/lib/stores/auth";
import { logger } from "~/lib/logger";
import { isServerError, isAuthError, getErrorStatus } from "~/lib/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) logger.log("Query retry info", { failureCount, error });

        if (failureCount >= 0 && import.meta.env.DEV) return false;
        if (failureCount > 3 && import.meta.env.PROD) return false;

        const status = getErrorStatus(error);
        return !status || ![401, 403].includes(status);
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        const status = getErrorStatus(error);
        if (status === 304) {
          toast.error("Content not modified!");
        } else {
          toast.error("Something went wrong!");
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAuthError(error)) {
        toast.error("Session expired!");
        authActions.reset();
        // Router navigation will be handled elsewhere
      }
      if (isServerError(error)) {
        toast.error("Internal Server Error!");
      }
    },
  }),
});