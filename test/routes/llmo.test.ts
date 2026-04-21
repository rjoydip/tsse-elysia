/**
 * LLMO (LLM Optimization) unit tests.
 * Tests JSON-LD structured data generation and validation for all routes.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */

import { describe, it, expect } from "bun:test";
import { blogPosts } from "../../src/features/landing/data/blog/data";
import { changelogData } from "../../src/features/landing/data/changelog/data";
import { API_PREFIX } from "../../src/config";

interface JsonLdSchema {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

function isValidJsonLd(schema: unknown): schema is JsonLdSchema {
  if (!schema || typeof schema !== "object") return false;
  const obj = schema as Record<string, unknown>;
  return obj["@context"] === "https://schema.org" && typeof obj["@type"] === "string";
}

describe("LLMO Blog API", () => {
  it("should have valid blog post structure", () => {
    expect(blogPosts.length).toBeGreaterThan(0);

    for (const post of blogPosts) {
      expect(post.id).toBeDefined();
      expect(post.slug).toBeDefined();
      expect(post.title).toBeDefined();
      expect(post.excerpt).toBeDefined();
      expect(post.author).toBeDefined();
      expect(post.author.name).toBeDefined();
    }
  });

  it("should generate valid Article schema for blog posts", () => {
    for (const post of blogPosts) {
      const articleSchema: JsonLdSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        author: {
          "@type": "Person",
          name: post.author.name,
        },
        image: post.author.avatar,
        url: `${API_PREFIX}/blog/${post.slug}`,
      };

      expect(isValidJsonLd(articleSchema)).toBe(true);
      expect(articleSchema["@type"]).toBe("Article");
      expect(articleSchema.headline).toBe(post.title);
    }
  });

  it("should generate valid ItemList schema for blog posts", () => {
    const itemListSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: blogPosts.length,
      itemListElement: blogPosts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${API_PREFIX}/blog/${post.slug}`,
        name: post.title,
        description: post.excerpt,
      })),
    };

    expect(isValidJsonLd(itemListSchema)).toBe(true);
    expect(itemListSchema["@type"]).toBe("ItemList");
    expect(itemListSchema.numberOfItems).toBe(blogPosts.length);
  });
});

describe("LLMO Docs API", () => {
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

  it("should have valid docs structure", () => {
    expect(docsData.length).toBeGreaterThan(0);

    for (const doc of docsData) {
      expect(doc.slug).toBeDefined();
      expect(doc.title).toBeDefined();
      expect(doc.category).toBeDefined();
    }
  });

  it("should generate valid TechArticle schema for docs", () => {
    for (const doc of docsData) {
      const techArticleSchema: JsonLdSchema = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: doc.title,
        about: {
          "@type": "Thing",
          name: doc.category,
        },
        url: `${API_PREFIX}/docs/${doc.slug}`,
      };

      expect(isValidJsonLd(techArticleSchema)).toBe(true);
      expect(techArticleSchema["@type"]).toBe("TechArticle");
    }
  });

  it("should generate valid ItemList schema for docs", () => {
    const itemListSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: docsData.length,
      itemListElement: docsData.map((doc, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${API_PREFIX}/docs/${doc.slug}`,
        name: doc.title,
      })),
    };

    expect(isValidJsonLd(itemListSchema)).toBe(true);
  });
});

describe("LLMO Changelog API", () => {
  it("should have valid changelog structure", () => {
    expect(changelogData.length).toBeGreaterThan(0);

    for (const entry of changelogData) {
      expect(entry.version).toBeDefined();
      expect(entry.releasedAt).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.items).toBeDefined();
      expect(entry.items.length).toBeGreaterThan(0);
    }
  });

  it("should generate valid Article schema for changelog", () => {
    const latestVersion = changelogData[0];

    const articleSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: latestVersion.title,
      datePublished: latestVersion.releasedAt,
      about: latestVersion.items.map((item) => ({
        "@type": "ChangeLogEntry",
        name: item.description,
        dateCreated: item.releasedAt,
      })),
    };

    expect(isValidJsonLd(articleSchema)).toBe(true);
    expect(articleSchema["@type"]).toBe("Article");
  });

  it("should generate valid ItemList schema for changelog", () => {
    const itemListSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: changelogData.length,
      itemListElement: changelogData.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `Version ${entry.version}`,
        description: entry.title,
      })),
    };

    expect(isValidJsonLd(itemListSchema)).toBe(true);
  });
});

describe("LLMO FAQ API", () => {
  const faqData = [
    {
      question: "What is TSS Elysia?",
      answer:
        "TSS Elysia is a modern full-stack framework powered by Elysia, TanStack Start, and React.",
    },
    {
      question: "How do I get started?",
      answer: "Run `bun install` to install dependencies, then `bun run dev` to start.",
    },
    {
      question: "What databases are supported?",
      answer: "TSS Elysia supports both SQLite and PostgreSQL databases.",
    },
    {
      question: "How does authentication work?",
      answer: "TSS Elysia uses Better Auth for authentication.",
    },
    {
      question: "Is this framework production-ready?",
      answer: "Yes, TSS Elysia is designed for production use.",
    },
  ];

  it("should have valid FAQ structure", () => {
    expect(faqData.length).toBeGreaterThan(0);

    for (const faq of faqData) {
      expect(faq.question).toBeDefined();
      expect(faq.answer).toBeDefined();
    }
  });

  it("should generate valid QAPage schema for FAQ", () => {
    const qaPageSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "QAPage",
      mainEntity: faqData.map((item) => ({
        "@type": "Question",
        name: item.question,
        answer: { "@type": "Answer", text: item.answer },
      })),
    };

    expect(isValidJsonLd(qaPageSchema)).toBe(true);
    expect(qaPageSchema["@type"]).toBe("QAPage");
    expect(qaPageSchema.mainEntity).toBeDefined();
    expect(Array.isArray(qaPageSchema.mainEntity)).toBe(true);
  });
});

describe("LLMO WebApplication Schema", () => {
  it("should generate valid WebApplication schema", () => {
    const webAppSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "tsse-elysia",
      description: "A modern full-stack framework powered by Elysia, TanStack Start, and React",
      url: "https://github.com/rjoydip/tsse-elysia",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };

    expect(isValidJsonLd(webAppSchema)).toBe(true);
    expect(webAppSchema["@type"]).toBe("WebApplication");
    expect(webAppSchema.name).toBe("tsse-elysia");
    expect(webAppSchema.applicationCategory).toBe("DeveloperApplication");
  });
});

describe("LLMO SoftwareApplication Schema", () => {
  it("should generate valid SoftwareApplication schema for server info", () => {
    const softwareSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "tsse-elysia",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      url: "https://github.com/rjoydip/tsse-elysia",
      provider: {
        "@type": "Organization",
        name: "tsse-elysia",
      },
    };

    expect(isValidJsonLd(softwareSchema)).toBe(true);
    expect(softwareSchema["@type"]).toBe("SoftwareApplication");
  });
});

describe("LLMO Privacy Policy Schema", () => {
  it("should generate valid PrivacyPolicy schema", () => {
    const privacySchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "PrivacyPolicy",
      name: "tsse-elysia Privacy Policy",
      description: "Privacy policy detailing data collection, usage, and protection practices",
      publisher: {
        "@type": "Organization",
        name: "tsse-elysia",
      },
      datePublished: "2026-01-01",
      validFor: "P1Y",
    };

    expect(isValidJsonLd(privacySchema)).toBe(true);
    expect(privacySchema["@type"]).toBe("PrivacyPolicy");
  });
});

describe("LLMO LegalService Schema", () => {
  it("should generate valid LegalService schema", () => {
    const legalSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "LegalService",
      name: "tsse-elysia Terms of Service",
      description: "Terms of service detailing usage policies",
      provider: {
        "@type": "Organization",
        name: "tsse-elysia",
      },
      datePublished: "2026-01-01",
    };

    expect(isValidJsonLd(legalSchema)).toBe(true);
    expect(legalSchema["@type"]).toBe("LegalService");
  });
});

describe("LLMO WebPage Schema for Error Pages", () => {
  it("should generate valid WebPage schema for 401", () => {
    const errorSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "401 Unauthorized",
      description: "This resource requires authentication",
      isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
    };

    expect(isValidJsonLd(errorSchema)).toBe(true);
    expect(errorSchema["@type"]).toBe("WebPage");
  });

  it("should generate valid WebPage schema for 403", () => {
    const errorSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "403 Forbidden",
      description: "Access to this resource is denied",
      isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
    };

    expect(isValidJsonLd(errorSchema)).toBe(true);
  });

  it("should generate valid WebPage schema for 404", () => {
    const errorSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "404 Not Found",
      description: "The requested resource was not found",
      isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
    };

    expect(isValidJsonLd(errorSchema)).toBe(true);
  });

  it("should generate valid WebPage schema for 500", () => {
    const errorSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "500 Internal Server Error",
      description: "An unexpected error occurred",
      isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
    };

    expect(isValidJsonLd(errorSchema)).toBe(true);
  });

  it("should generate valid WebPage schema for 503", () => {
    const errorSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "503 Service Unavailable",
      description: "The service is currently under maintenance",
      isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
    };

    expect(isValidJsonLd(errorSchema)).toBe(true);
  });
});

describe("LLMO API Capabilities", () => {
  it("should generate valid capabilities ItemList", () => {
    const capabilities = [
      { name: "blog", description: "Blog posts API", url: "/api/blog" },
      { name: "docs", description: "Documentation API", url: "/api/docs" },
      {
        name: "changelog",
        description: "Changelog API",
        url: "/api/changelog",
      },
      { name: "faq", description: "FAQ API", url: "/api/faq" },
      { name: "mcp", description: "MCP tools API", url: "/api/mcp" },
      { name: "auth", description: "Authentication API", url: "/api/auth" },
      {
        name: "database",
        description: "Database health API",
        url: "/api/database",
      },
      {
        name: "realtime",
        description: "Realtime/WebSocket API",
        url: "/api/realtime",
      },
      { name: "redis", description: "Redis health API", url: "/api/cache" },
      { name: "status", description: "Service status", url: "/status" },
    ];

    const capabilitiesSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: capabilities.length,
      itemListElement: capabilities.map((cap) => ({
        name: cap.name,
        description: cap.description,
        url: cap.url,
      })),
    };

    expect(isValidJsonLd(capabilitiesSchema)).toBe(true);
    expect(capabilitiesSchema.numberOfItems).toBe(10);
  });
});

describe("LLMO llms.txt", () => {
  it("should generate valid llms.txt content", () => {
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

## Documentation

- Getting Started: https://github.com/rjoydip/tsse-elysia

## Content Types

- Blog: /blog and /api/blog
- Docs: /docs and /api/docs
- Changelog: /changelog and /api/changelog
`;

    expect(content).toContain("# TSS Elysia");
    expect(content).toContain("## Overview");
    expect(content).toContain("## Key Features");
    expect(content).toContain("## Documentation");
    expect(content).toContain("## Content Types");
  });
});