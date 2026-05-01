/**
 * Documentation Landing Page
 * Getting Started overview with quick-start steps, features, and next steps
 */

import { Link } from "@tanstack/react-router";
import { features } from "~/config/features";

const quickStartSteps = [
  {
    title: "Install dependencies",
    description: "Install the required packages using Bun",
    code: "bun install",
  },
  {
    title: "Configure environment",
    description: "Set up your environment variables",
    code: "cp .env.example .env",
  },
  {
    title: "Start development server",
    description: "Run the development server",
    code: "bun run dev",
  },
];

export function DocsLandingPage() {
  return (
    <>
      {/* Title */}
      <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Getting Started</h1>
      <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
        Learn how to set up and build with TSS Elysia - a modern full-stack TypeScript application.
      </p>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground">Quick Start</h2>
        <div className="space-y-4">
          {quickStartSteps.map((step, index) => (
            <div
              key={index}
              className="border rounded-lg p-5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3 ml-10">{step.description}</p>
              <div className="ml-10">
                <pre className="bg-[#0a0a0a] px-4 py-2.5 rounded-md overflow-x-auto border">
                  <code className="text-sm font-mono text-primary">{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border rounded-lg p-5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/docs/$"
            params={{ _splat: "api/api-references" }}
            className="block p-5 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <h3 className="font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
              API references
            </h3>
            <p className="text-sm text-muted-foreground">
              Application and authentication APIs — links to Scalar, OpenAPI JSON, and auth docs
            </p>
          </Link>
          <Link
            to="/docs/$"
            params={{ _splat: "getting-started/development" }}
            className="block p-5 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <h3 className="font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
              Development Setup
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure your local development environment
            </p>
          </Link>
          <Link
            to="/docs/$"
            params={{ _splat: "auth/overview" }}
            className="block p-5 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <h3 className="font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
              Authentication
            </h3>
            <p className="text-sm text-muted-foreground">Learn about authentication and security</p>
          </Link>
        </div>
      </section>
    </>
  );
}