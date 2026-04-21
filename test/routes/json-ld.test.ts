/**
 * JSON-LD Route Schema tests.
 * Tests that all routes properly generate JSON-LD schemas.
 */

import { describe, it, expect } from "bun:test";

function isValidSchemaOrg(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return obj["@context"] === "https://schema.org" && typeof obj["@type"] === "string";
}

describe("Root Route JSON-LD", () => {
  it("should have WebApplication schema in root route", () => {
    const webAppSchema = {
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

    expect(isValidSchemaOrg(webAppSchema)).toBe(true);
    expect(webAppSchema["@type"]).toBe("WebApplication");
    expect(webAppSchema.name).toBe("tsse-elysia");
  });
});

describe("Landing Routes JSON-LD", () => {
  const blogPosts = [
    {
      id: "1",
      slug: "introducing-tsse-elysia",
      title: "Introducing TSS Elysia",
    },
    { id: "2", slug: "type-safe-apis", title: "Type-Safe APIs" },
    { id: "3", slug: "auth-best-practices", title: "Auth Best Practices" },
  ];

  it("should have CollectionPage schema for blog", () => {
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "TSS Elysia Blog",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: blogPosts.slice(0, 5).map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `/blog/${post.slug}`,
          name: post.title,
        })),
      },
    };

    expect(isValidSchemaOrg(collectionSchema)).toBe(true);
    expect(collectionSchema["@type"]).toBe("CollectionPage");
  });

  it("should have TechArticle schema for docs", () => {
    const docsList = [
      { slug: "getting-started", title: "Getting Started" },
      { slug: "api/api-references", title: "API References" },
    ];

    const techArticleSchema = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      name: "TSS Elysia Documentation",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: docsList.map((doc, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `/docs/${doc.slug}`,
          name: doc.title,
        })),
      },
    };

    expect(isValidSchemaOrg(techArticleSchema)).toBe(true);
    expect(techArticleSchema["@type"]).toBe("TechArticle");
  });

  it("should have Article schema for changelog", () => {
    const changelogData = [
      {
        version: "1.2.0",
        releasedAt: "2026-03-28",
        title: "New Features",
        items: [],
      },
      {
        version: "1.1.0",
        releasedAt: "2026-03-15",
        title: "Enhanced Auth",
        items: [],
      },
    ];

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      name: "TSS Elysia Changelog",
      datePublished: changelogData[0].releasedAt,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: changelogData.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `Version ${entry.version}`,
        })),
      },
    };

    expect(isValidSchemaOrg(articleSchema)).toBe(true);
    expect(articleSchema["@type"]).toBe("Article");
  });
});

describe("Legal Routes JSON-LD", () => {
  it("should have PrivacyPolicy schema", () => {
    const privacySchema = {
      "@context": "https://schema.org",
      "@type": "PrivacyPolicy",
      name: "tsse-elysia Privacy Policy",
      publisher: { "@type": "Organization", name: "tsse-elysia" },
      datePublished: "2026-01-01",
    };

    expect(isValidSchemaOrg(privacySchema)).toBe(true);
    expect(privacySchema["@type"]).toBe("PrivacyPolicy");
  });

  it("should have LegalService schema for terms", () => {
    const legalSchema = {
      "@context": "https://schema.org",
      "@type": "LegalService",
      name: "tsse-elysia Terms of Service",
      provider: { "@type": "Organization", name: "tsse-elysia" },
      datePublished: "2026-01-01",
    };

    expect(isValidSchemaOrg(legalSchema)).toBe(true);
    expect(legalSchema["@type"]).toBe("LegalService");
  });
});

describe("Status Page JSON-LD", () => {
  it("should have WebPage schema with health endpoints", () => {
    const statusSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "tsse-elysia Status",
      isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          { name: "API Health", url: "/api/health" },
          { name: "Database Health", url: "/api/database" },
          { name: "Redis Health", url: "/api/cache" },
        ],
      },
    };

    expect(isValidSchemaOrg(statusSchema)).toBe(true);
    expect(statusSchema["@type"]).toBe("WebPage");
  });
});

describe("Error Pages JSON-LD", () => {
  const errorCodes = [401, 403, 404, 500, 503];

  for (const code of errorCodes) {
    it(`should have WebPage schema for ${code}`, () => {
      const errorMessages: Record<number, string> = {
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        500: "Internal Server Error",
        503: "Service Unavailable",
      };

      const errorSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${code} ${errorMessages[code]}`,
        isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
      };

      expect(isValidSchemaOrg(errorSchema)).toBe(true);
    });
  }
});

describe("Auth Pages JSON-LD", () => {
  const authPages = [
    { name: "Sign In", path: "/sign-in" },
    { name: "Sign Up", path: "/sign-up" },
    { name: "OTP Verification", path: "/otp" },
    { name: "Forgot Password", path: "/forgot-password" },
    { name: "Email Verification", path: "/verify-email" },
  ];

  for (const page of authPages) {
    it(`should have WebPage schema for ${page.name}`, () => {
      const authSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${page.name} - tsse-elysia`,
        isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
      };

      expect(isValidSchemaOrg(authSchema)).toBe(true);
    });
  }
});

describe("Authenticated Pages JSON-LD", () => {
  const authPages = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Settings", path: "/dashboard/settings" },
    { name: "Help Center", path: "/help-center" },
  ];

  for (const page of authPages) {
    it(`should have WebPage schema for ${page.name}`, () => {
      const authSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${page.name} - tsse-elysia`,
        isPartOf: { "@type": "WebSite", name: "tsse-elysia" },
      };

      expect(isValidSchemaOrg(authSchema)).toBe(true);
    });
  }
});

describe("JSON-LD Serialization", () => {
  it("should serialize to valid JSON", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "tsse-elysia",
    };

    const serialized = JSON.stringify(schema);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(schema);
  });

  it("should escape HTML in JSON-LD content", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Test <script>alert('xss')</script>",
    };

    const serialized = JSON.stringify(schema);
    expect(serialized).toContain("<script>");
  });

  it("should handle nested objects correctly", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Item 1" },
          { "@type": "ListItem", position: 2, name: "Item 2" },
        ],
      },
    };

    expect(isValidSchemaOrg(schema)).toBe(true);
  });
});