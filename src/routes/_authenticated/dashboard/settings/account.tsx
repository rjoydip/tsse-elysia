import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "~/components/auth/auth-guard";
import { SettingsAccount } from "~/features/settings/account";
import { useSettingsStore, settingsActions } from "~/lib/stores/settings-store";

async function settingsLoader() {
  await settingsActions.fetchAll();
}

function SettingsAccountWithGuard() {
  const { account, loading } = useSettingsStore();

  return (
    <AuthGuard>
      <SettingsAccount initialAccount={account} isLoading={loading} />
    </AuthGuard>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard/settings/account")({
  component: SettingsAccountWithGuard,
  loader: async () => settingsLoader(),
});