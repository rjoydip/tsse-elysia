/**
 * Application Router Configuration
 * Sets up TanStack Router with error handling and authentication.
 */

import { createRouter } from "@tanstack/react-router";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { initLog } from "evlog/client";
import { toast } from "sonner";
import { routeTree } from "~/routeTree.gen";
import { authActions } from "~/lib/stores/auth-store";
import { logger } from "~/lib/logger";
import { isServerError, isAuthError, getErrorStatus, getErrorMessage } from "~/lib/errors";

initLog({
  service: "app",
  transport: {
    enabled: import.meta.env.PROD,
    endpoint: "/api/_evlog/ingest", // default endpoint
  },
});
logger.info("Application started");

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

function handleServerError(error: Error) {
  logger.error(String(error));

  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  if (status === 204) {
    toast.error("Content not found.");
    return;
  }

  if (message) {
    toast.error(message);
  } else {
    toast.error("Something went wrong!");
  }
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function getRouter() {
  return router;
}

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
        handleServerError(error);

        const status = getErrorStatus(error);
        if (status === 304) {
          toast.error("Content not modified!");
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAuthError(error)) {
        toast.error("Session expired!");
        authActions.reset();
        router.navigate({
          to: "/sign-in",
          search: { redirect: `${router.history.location.href}` },
        });
      }
      if (isServerError(error)) {
        toast.error("Internal Server Error!");
        if (import.meta.env.PROD) {
          router.navigate({ to: "/" });
        }
      }
    },
  }),
});