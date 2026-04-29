/**
 * LLMO (LLM Optimization) API endpoints plugin.
 * Delegates to llmo services for schema.org data transformation.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/llmo
 */

import { Elysia } from "elysia";
import { getBlogData } from "~/services/llmo";
import { getDocsData } from "~/services/llmo";
import { getChangelogData } from "~/services/llmo";
import { getFaqData } from "~/services/llmo";
import { getServerInfo } from "~/services/llmo";
import { getCapabilities } from "~/services/llmo";
import { getLlmsTxtContent } from "~/services/llmo";

export const llmoRoutes = new Elysia({ name: "api.routes.llmo" })
  .get(
    "/blog",
    async ({ request }) => {
      const url = new URL(request.url);
      const slug = url.searchParams.get("slug");
      const limit = url.searchParams.get("limit");
      const data = await getBlogData({ slug, limit });
      return Response.json(data);
    },
    {
      detail: {
        summary: "Blog API",
        description: "Machine-readable blog posts in schema.org format",
        tags: ["llmo", "blog"],
      },
    },
  )
  .get(
    "/docs",
    async ({ request }) => {
      const url = new URL(request.url);
      const slug = url.searchParams.get("slug");
      const data = getDocsData({ slug });
      return Response.json(data);
    },
    {
      detail: {
        summary: "Docs API",
        description: "Machine-readable documentation in schema.org format",
        tags: ["llmo", "docs"],
      },
    },
  )
  .get(
    "/changelog",
    async ({ request }) => {
      const url = new URL(request.url);
      const version = url.searchParams.get("version");
      const latest = url.searchParams.get("latest");
      const data = getChangelogData({ version, latest });
      return Response.json(data);
    },
    {
      detail: {
        summary: "Changelog API",
        description: "Machine-readable changelog in schema.org format",
        tags: ["llmo", "changelog"],
      },
    },
  )
  .get(
    "/faq",
    async ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get("q");
      const data = getFaqData({ q });
      return Response.json(data);
    },
    {
      detail: {
        summary: "FAQ API",
        description: "Machine-readable FAQ in schema.org QAPage format",
        tags: ["llmo", "faq"],
      },
    },
  )
  .get(
    "/llms.txt",
    async () => {
      const content = getLlmsTxtContent();
      return new Response(content, {
        headers: { "Content-Type": "text/plain" },
      });
    },
    {
      detail: {
        summary: "LLMS.txt",
        description: "AI system guidance file",
        tags: ["llmo"],
      },
    },
  )
  .get(
    "/server",
    async () => {
      const data = getServerInfo();
      return Response.json(data);
    },
    {
      detail: {
        summary: "Server Info",
        description: "Machine-readable server information in schema.org format",
        tags: ["llmo", "info"],
      },
    },
  )
  .get(
    "/capabilities",
    async () => {
      const data = getCapabilities();
      return Response.json(data);
    },
    {
      detail: {
        summary: "API Capabilities",
        description: "List of all available API endpoints",
        tags: ["llmo", "info"],
      },
    },
  );