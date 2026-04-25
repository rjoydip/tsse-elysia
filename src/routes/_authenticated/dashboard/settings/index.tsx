import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "~/config";
import { AuthGuard } from "~/components/auth/auth-guard";
import { SettingsProfile } from "~/features/settings/profile";
import { useSettingsStore, settingsActions } from "~/lib/stores/settings-store";

async function settingsLoader() {
  await settingsActions.fetchAll();
}

function SettingsProfileWithGuard() {
  const { profile, loading } = useSettingsStore();

  return (
    <AuthGuard>
      <SettingsProfile initialProfile={profile} isLoading={loading} />
    </AuthGuard>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard/settings/")({
  component: SettingsProfileWithGuard,
  loader: async () => settingsLoader(),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: `${APP_NAME} Settings - Manage your account settings` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Settings - ${APP_NAME}`,
          description: "Manage your account settings",
          isPartOf: { "@type": "WebSite", name: APP_NAME },
        }),
      },
    ],
  }),
});