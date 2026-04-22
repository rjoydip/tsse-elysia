/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { A11yer } from "a11yer";
import { StrictMode } from "react";
import { NavigationProgress } from "~/components/navigation-progress";
import { GeneralError } from "~/features/errors/general-error";
import { NotFoundError } from "~/features/errors/not-found-error";
import { Toaster } from "~/components/ui/sonner";
import { DirectionProvider } from "~/context/direction-provider";
import { FontProvider } from "~/context/font-provider";
import { ThemeProvider } from "~/context/theme-provider";
import { useAuthSync } from "~/lib/auth/store-sync";
import { queryClient } from "~/router";
import appCss from "~/styles/app.css?url";
import { SearchProvider } from "~/context/search-provider";
import { GITHUB_REPO_URL } from "~/config";

export const Route = createRootRoute({
  head: () => ({
    title: "tsse-elysia",
    meta: [
      { charSet: "utf8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "description",
        content:
          "tsse-elysia - A modern full-stack framework powered by Elysia, TanStack Start, and React",
      },
      {
        name: "author",
        content: "tsse-elysia Team",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        rel: "alternate",
        href: "/api/llms.txt",
        type: "text/plain",
        title: "LLM Documentation",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "tsse-elysia",
          description: "A modern full-stack framework powered by Elysia, TanStack Start, and React",
          url: GITHUB_REPO_URL,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Windows, macOS, Linux",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          author: {
            "@type": "Organization",
            name: "tsse-elysia",
            url: GITHUB_REPO_URL,
          },
        }),
      },
    ],
  }),
  errorComponent: GeneralError,
  notFoundComponent: NotFoundError,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  useAuthSync();

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <SearchProvider>
                <A11yer>
                  <html lang="en">
                    <head>
                      <HeadContent />
                    </head>
                    <body>
                      <NavigationProgress />
                      {children}
                      <Toaster duration={5000} />
                      {import.meta.env.MODE === "development" && (
                        <>
                          <ReactQueryDevtools buttonPosition="bottom-left" />
                          <TanStackRouterDevtools position="bottom-right" />
                        </>
                      )}
                      <Scripts />
                    </body>
                  </html>
                </A11yer>
              </SearchProvider>
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}