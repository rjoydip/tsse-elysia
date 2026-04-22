import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "~/config";
import { SignIn } from "~/features/auth/sign-in";

export const Route = createFileRoute("/(auth)/sign-in")({
  component: SignIn,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: `Sign in to your ${APP_NAME} account`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Sign In - ${APP_NAME}`,
          description: "Sign in to your account",
          isPartOf: { "@type": "WebSite", name: APP_NAME },
        }),
      },
    ],
  }),
});