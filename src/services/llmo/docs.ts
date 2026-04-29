/**
 * LLMO Docs service.
 * Handles static docs data for schema.org transformation.
 */

import { API_PREFIX } from "~/config";

export interface DocEntry {
  slug: string;
  title: string;
  category: string;
}

export interface DocsResponse {
  "@context": "https://schema.org";
  "@type": "TechArticle" | "ItemList";
  headline?: string;
  about?: string;
  numberOfItems?: number;
  itemListElement?: Array<{
    "@type": "ListItem";
    position: number;
    url: string;
    name: string;
  }>;
}

const docsData: DocEntry[] = [
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

export interface DocsQuery {
  slug?: string | null;
}

export function getDocsData(query: DocsQuery): DocsResponse {
  const { slug } = query;

  if (slug) {
    const doc = docsData.find((d) => d.slug === slug);
    if (!doc) {
      return {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: "Not Found",
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: doc.title,
      about: doc.category,
    };
  }

  return {
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
}