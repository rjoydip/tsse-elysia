import { ContentSection } from "../components/content-section";
import { AccountForm } from "./account-form";
import { AccountData } from "~/lib/stores/settings";

/**
 * Account settings page component.
 */
export function SettingsAccount({
  initialAccount,
  isLoading,
}: {
  initialAccount: AccountData | null;
  isLoading: boolean;
}) {
  return (
    <ContentSection
      title="Account"
      desc="Update your account settings. Set your preferred language and
          timezone."
    >
      <AccountForm initialAccount={initialAccount} isLoading={isLoading} />
    </ContentSection>
  );
}