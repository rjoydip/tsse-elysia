/**
 * LLMO Changelog service.
 * Handles changelog data fetching and schema.org transformation.
 */

import { changelogData, getLatestVersion } from "~/features/landing/data/changelog/data";

export interface ChangelogEntry {
  version: string;
  title: string;
  releasedAt: string;
  items: Array<{
    description: string;
    releasedAt?: string;
  }>;
}

export interface ChangelogResponse {
  "@context": "https://schema.org";
  "@type": "Article" | "ItemList";
  headline?: string;
  datePublished?: string;
  about?: Array<{
    "@type": "ChangeLogEntry";
    name: string;
    dateCreated?: string;
  }>;
  numberOfItems?: number;
  itemListElement?: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    description: string;
  }>;
}

export interface ChangelogQuery {
  version?: string | null;
  latest?: string | null;
}

export function getChangelogData(query: ChangelogQuery): ChangelogResponse {
  const { version, latest } = query;

  if (version) {
    const entry = changelogData.find((e) => e.version === version);
    if (!entry) {
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Not Found",
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: entry.title,
      datePublished: entry.releasedAt,
      about: entry.items.map((item) => ({
        "@type": "ChangeLogEntry",
        name: item.description,
        dateCreated: item.releasedAt,
      })),
    };
  }

  if (latest === "true") {
    const entry = getLatestVersion();
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: entry.title,
      datePublished: entry.releasedAt,
    };
  }

  return {
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
}