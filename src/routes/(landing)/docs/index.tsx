/**
 * Docs Index Route
 * Optimized with JSON-LD structured data for LLMO.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */

import { createFileRoute } from "@tanstack/react-router";
import { DocsLandingPage } from "~/features/landing/docs/index";
import { docsListLLMO } from "~/config/docs";

export const Route = createFileRoute("/(landing)/docs/")({
  component: DocsLandingPage,
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Complete documentation for TSS Elysia - getting started, API references, authentication guides, and deployment",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          name: "TSS Elysia Documentation",
          description:
            "Complete documentation for TSS Elysia - getting started, API references, authentication guides, and deployment",
          about: docsListLLMO.map((doc) => ({
            "@type": "Thing",
            name: doc.title,
            description: doc.category,
          })),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: docsListLLMO.map((doc, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `/docs/${doc.slug}`,
              name: doc.title,
            })),
          },
        }),
      },
    ],
  }),
});