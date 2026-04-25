/**
 * LLMO (LLM Optimization) API endpoints plugin.
 * Provides machine-readable data in schema.org format for AI systems.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */

import { Elysia } from "elysia";
import { blogPosts, getBlogPost } from "~/features/landing/data/blog/data";
import { changelogData, getLatestVersion } from "~/features/landing/data/changelog/data";
import { APP_NAME, API_PREFIX, GITHUB_REPO_URL } from "~/config";

const docsData = [
  { slug: "getting-started", title: "Getting Started", category: "Guide" },
  {
    slug: "api/api-references",
    title: "API References",
    category: "Reference",
  },
  {
    slug: "getting-started/development",
    title: "Development Setup",
    category: "Guide",
  },
  { slug: "auth/overview", title: "Authentication", category: "Guide" },
  {
    slug: "deployment/production",
    title: "Production Deployment",
    category: "Guide",
  },
];

const faqData = [
  {
    question: "What is TSS Elysia?",
    answer:
      "TSS Elysia is a modern full-stack framework powered by Elysia, TanStack Start, and React. It provides end-to-end type safety, authentication, and database integration.",
  },
  {
    question: "How do I get started?",
    answer:
      "Run `bun install` to install dependencies, then `bun run dev` to start the development server.",
  },
  {
    question: "What databases are supported?",
    answer: "TSS Elysia supports both SQLite and PostgreSQL databases through Drizzle ORM.",
  },
  {
    question: "How does authentication work?",
    answer: "TSS Elysia uses Better Auth for authentication, supporting OAuth and 2FA.",
  },
  {
    question: "Is this framework production-ready?",
    answer: "Yes, TSS Elysia is designed for production use with Docker support.",
  },
  {
    question: "What is the tech stack?",
    answer:
      "Backend: Elysia, Drizzle ORM, Better Auth. Frontend: React 19, TanStack Router, TanStack Query.",
  },
  {
    question: "How do I deploy to production?",
    answer:
      "TSS Elysia supports Docker deployment. Build with `docker build` and run with proper environment variables.",
  },
  {
    question: "Are there TypeScript type safety guarantees?",
    answer: "Yes, TSS Elysia provides end-to-end type safety from database schema to frontend.",
  },
];

/**
 * Blog endpoint handler.
 */
function handleBlog({ request }: { request: Request }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  if (slug) {
    const post = getBlogPost(slug);
    if (!post) {
      return Response.json(
        {
          error: "Blog post not found",
          message: `No blog post found with slug: ${slug}`,
        },
        { status: 404 },
      );
    }

    return Response.json({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: { "@type": "Person", name: post.author.name },
    });
  }

  const posts = blogPosts.slice(0, limit);

  return Response.json({
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${API_PREFIX}/blog/${post.slug}`,
      name: post.title,
      description: post.excerpt,
    })),
  });
}

/**
 * Docs endpoint handler.
 */
function handleDocs({ request }: { request: Request }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const doc = docsData.find((d) => d.slug === slug);
    if (!doc) {
      return Response.json(
        {
          error: "Documentation not found",
          message: `No documentation found for slug: ${slug}`,
        },
        { status: 404 },
      );
    }

    return Response.json({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: doc.title,
      about: doc.category,
    });
  }

  return Response.json({
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: docsData.length,
    itemListElement: docsData.map((doc, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${API_PREFIX}/docs/${doc.slug}`,
      name: doc.title,
    })),
  });
}

/**
 * Changelog endpoint handler.
 */
function handleChangelog({ request }: { request: Request }) {
  const url = new URL(request.url);
  const version = url.searchParams.get("version");
  const latest = url.searchParams.get("latest") === "true";

  if (version) {
    const entry = changelogData.find((e) => e.version === version);
    if (!entry) {
      return Response.json(
        {
          error: "Changelog not found",
          message: `No changelog found for version: ${version}`,
        },
        { status: 404 },
      );
    }

    return Response.json({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: entry.title,
      datePublished: entry.releasedAt,
      about: entry.items.map((item) => ({
        "@type": "ChangeLogEntry",
        name: item.description,
        dateCreated: item.releasedAt,
      })),
    });
  }

  if (latest) {
    const entry = getLatestVersion();
    return Response.json({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: entry.title,
      datePublished: entry.releasedAt,
    });
  }

  return Response.json({
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: changelogData.length,
    itemListElement: changelogData.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Version ${entry.version}`,
      description: entry.title,
    })),
  });
}

/**
 * FAQ endpoint handler.
 */
function handleFaq({ request }: { request: Request }) {
  const url = new URL(request.url);
  const question = url.searchParams.get("q");

  let filtered = faqData;
  if (question) {
    filtered = faqData.filter(
      (faq) =>
        faq.question.toLowerCase().includes(question.toLowerCase()) ||
        faq.answer.toLowerCase().includes(question.toLowerCase()),
    );
  }

  return Response.json({
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: filtered.map((item) => ({
      "@type": "Question",
      name: item.question,
      answer: { "@type": "Answer", text: item.answer },
    })),
  });
}

/**
 * LLMS.txt endpoint handler.
 */
function handleLlmsTxt() {
  const content = `# TSS Elysia

TSS Elysia is a modern full-stack framework powered by Elysia, TanStack Start, and React.

## Overview

- Framework: Elysia + TanStack Start + React 19
- Language: TypeScript
- Database: SQLite / PostgreSQL with Drizzle ORM
- Authentication: Better Auth with OAuth and 2FA

## Key Features

- End-to-end type safety
- Server-side rendering
- Built-in authentication
- Type-safe database queries

## Documentation

- Getting Started: ${GITHUB_REPO_URL}
- API: /api/* routes

## Content Types

- Blog: /blog and /api/blog
- Docs: /docs and /api/docs
- Changelog: /changelog and /api/changelog
`;

  return new Response(content, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Server info endpoint handler.
 */
function handleServerInfo() {
  return Response.json({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    url: GITHUB_REPO_URL,
    provider: {
      "@type": "Organization",
      name: "tsse-elysia",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "100",
    },
  });
}

/**
 * API capabilities endpoint handler.
 */
function handleCapabilities() {
  return Response.json({
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: 10,
    itemListElement: [
      {
        name: "blog",
        description: "Blog posts API",
        url: `${API_PREFIX}/blog`,
      },
      {
        name: "docs",
        description: "Documentation API",
        url: `${API_PREFIX}/docs`,
      },
      {
        name: "changelog",
        description: "Changelog API",
        url: `${API_PREFIX}/changelog`,
      },
      { name: "faq", description: "FAQ API", url: `${API_PREFIX}/faq` },
      { name: "mcp", description: "MCP tools API", url: "/api/mcp" },
      { name: "auth", description: "Authentication API", url: "/api/auth" },
      {
        name: "database",
        description: "Database health API",
        url: `${API_PREFIX}/database`,
      },
      {
        name: "realtime",
        description: "Realtime/WebSocket API",
        url: `${API_PREFIX}/realtime`,
      },
      {
        name: "redis",
        description: "Redis health API",
        url: `${API_PREFIX}/redis`,
      },
      { name: "status", description: "Service status", url: "/status" },
    ],
  });
}

/**
 * LLMO API route group.
 * Mounted under `/api` by the core API application.
 */
export const llmoRoutes = new Elysia({ name: "api.routes.llmo" })
  .get("/blog", handleBlog, {
    detail: {
      summary: "Blog API",
      description: "Machine-readable blog posts in schema.org format",
      tags: ["llmo", "blog"],
    },
  })
  .get("/docs", handleDocs, {
    detail: {
      summary: "Docs API",
      description: "Machine-readable documentation in schema.org format",
      tags: ["llmo", "docs"],
    },
  })
  .get("/changelog", handleChangelog, {
    detail: {
      summary: "Changelog API",
      description: "Machine-readable changelog in schema.org format",
      tags: ["llmo", "changelog"],
    },
  })
  .get("/faq", handleFaq, {
    detail: {
      summary: "FAQ API",
      description: "Machine-readable FAQ in schema.org QAPage format",
      tags: ["llmo", "faq"],
    },
  })
  .get("/llms.txt", handleLlmsTxt, {
    detail: {
      summary: "LLMS.txt",
      description: "AI system guidance file",
      tags: ["llmo"],
    },
  })
  .get("/server", handleServerInfo, {
    detail: {
      summary: "Server Info",
      description: "Machine-readable server information in schema.org format",
      tags: ["llmo", "info"],
    },
  })
  .get("/capabilities", handleCapabilities, {
    detail: {
      summary: "API Capabilities",
      description: "List of all available API endpoints",
      tags: ["llmo", "info"],
    },
  });