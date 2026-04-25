/**
 * Docs Layout Route
 */

import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "~/features/landing/docs/layout";

export const Route = createFileRoute("/(landing)/docs")({
  component: DocsLayout,
});