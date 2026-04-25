import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "~/components/auth/auth-guard";
import { SettingsNotifications } from "~/features/settings/notifications";
import { useSettingsStore, settingsActions } from "~/lib/stores/settings-store";

async function settingsLoader() {
  await settingsActions.fetchAll();
}

function SettingsNotificationsWithGuard() {
  const { notifications, loading } = useSettingsStore();

  return (
    <AuthGuard>
      <SettingsNotifications initialNotifications={notifications} isLoading={loading} />
    </AuthGuard>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard/settings/notifications")({
  component: SettingsNotificationsWithGuard,
  loader: async () => settingsLoader(),
});