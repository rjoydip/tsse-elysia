import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "~/config";
import { Dashboard } from "~/features/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: `${APP_NAME} Dashboard - Your personal dashboard`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Dashboard - ${APP_NAME}`,
          description: "Your personal dashboard",
          isPartOf: { "@type": "WebSite", name: APP_NAME },
        }),
      },
    ],
  }),
});