/**
 * Landing Page
 * Following Supabase UI design: https://supabase.com/
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { buttonVariants } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Header } from "~/components/layout/landing/header";
import { Footer } from "~/components/layout/landing/footer";
import { CodeHighlight } from "~/components/docs/code-highlight";
import { cn } from "~/lib/utils";
import { APP_VERSION, GITHUB_REPO_URL } from "~/config";
import { BrandDescription, BrandTitle } from "~/components/layout/landing/branding";
import { getShikiHighlighter } from "~/lib/shiki";
import { AnimatedPageBackground } from "~/components/animated-page-background";

export const Route = createFileRoute("/")({
  component: Home,
});

// Code snippet to display on landing page
const codeSnippet = `new Elysia({
  name: "api-app",
  prefix: API_PREFIX,
})
  // Apply composed middleware (CORS, Helmet, Rate Limit, OpenTelemetry)
  .use(
    composedMiddleware({
      openAPP_NAME: "API",
    }),
  )
  // Store application name
  .state("name", APP_NAME)
  /**
   * Health check endpoint for monitoring.
   * Used by load balancers and orchestration systems (Kubernetes, etc.)
   * Returns simple JSON with service status.
   */
  .get("/health", async ({ store: { name } }) => ({ name, status: "ok" }), {
    detail: {
      summary: "Get API health",
      description: "Get API health",
      tags: ["api-health"],
      responses: {
        200: { description: "Success" },
      },
    },
  });`;

const features = [
  {
    title: "Type-Safe API",
    description: "End-to-end type safety from database to frontend with full TypeScript support",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Modern Stack",
    description: "Built with React 19, TanStack Start, and Elysia for optimal performance",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    title: "Authentication",
    description: "Secure authentication with Better Auth supporting OAuth and 2FA",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Database",
    description: "Flexible database support with Drizzle ORM for type-safe queries",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    title: "Server-Side Rendering",
    description: "Full SSR support with TanStack Start for optimal SEO and performance",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </svg>
    ),
  },
  {
    title: "Developer Experience",
    description: "Hot module replacement, type checking, and linting out of the box",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v4" />
        <path d="m14.5 16.5-3 3" />
        <path d="M12 14v4" />
        <path d="m9.5 9.5 3 3" />
        <path d="M8 12h8" />
        <path d="M14.5 7.5 12 5" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

function Home() {
  /**
   * Preloads the shared Shiki highlighter once the landing page mounts.
   * This reduces perceived delay before the first highlighted code block appears.
   */
  useEffect(() => {
    void getShikiHighlighter();
  }, []);

  return (
    <div className="relative isolate min-h-screen bg-background">
      <AnimatedPageBackground />
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-8 px-4 py-1.5 border-primary bg-primary text-primary text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-background dark:bg-ring animate-pulse self-center" />
              v{APP_VERSION} Released
            </span>
          </Badge>
          <BrandTitle size="5xl" />
          <BrandDescription size="xl" />
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/docs"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
              )}
            >
              Get Started
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            {/**
             * Interactive OpenAPI UI is served by Elysia (`@elysiajs/openapi`), not by the
             * markdown docs app — use a real navigation so `/api/reference` loads the Scalar page.
             * In-app hub for app + auth APIs lives at `/docs/api/api-references`.
             */}
            <a
              href="/api/reference"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              API Reference
            </a>
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <CodeHighlight code={codeSnippet} language="typescript" filename="api/$.ts" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
            A complete solution for building modern full-stack TypeScript applications
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl border bg-background hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10x</div>
              <div className="text-sm text-muted-foreground">Faster Development</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Type-Safe</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">0</div>
              <div className="text-sm text-muted-foreground">Runtime Errors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Start building your next project with TSS Elysia today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/docs"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8",
              )}
            >
              Read the Docs
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-2"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}