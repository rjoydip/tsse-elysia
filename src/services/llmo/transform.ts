/**
 * LLMO Transform utilities.
 * Schema.org transformation helpers for server info and capabilities.
 */

import { APP_NAME, API_PREFIX, GITHUB_REPO_URL } from "~/config";

export interface ServerInfoResponse {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  provider: {
    "@type": "Organization";
    name: string;
  };
  aggregateRating: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: string;
  };
}

export interface CapabilityItem {
  name: string;
  description: string;
  url: string;
}

export interface CapabilitiesResponse {
  "@context": "https://schema.org";
  "@type": "ItemList";
  numberOfItems: number;
  itemListElement: CapabilityItem[];
}

export function getServerInfo(): ServerInfoResponse {
  return {
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
  };
}

export function getCapabilities(): CapabilitiesResponse {
  const capabilities: CapabilityItem[] = [
    { name: "blog", description: "Blog posts API", url: `${API_PREFIX}/blog` },
    { name: "docs", description: "Documentation API", url: `${API_PREFIX}/docs` },
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
    { name: "redis", description: "Redis health API", url: `${API_PREFIX}/redis` },
    { name: "status", description: "Service status", url: "/status" },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: capabilities.length,
    itemListElement: capabilities,
  };
}