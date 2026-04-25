import { ContentSection } from "../components/content-section";
import { ProfileForm } from "./profile-form";

/**
 * Profile settings page component.
 * Displays the profile form for users to edit their information.
 * @param {{ initialProfile: any, isLoading: boolean }} props - Component props
 */
export function SettingsProfile({
  initialProfile,
  isLoading,
}: {
  initialProfile: any;
  isLoading: boolean;
}) {
  return (
    <ContentSection title="Profile" desc="This is how others will see you on the site.">
      <ProfileForm initialProfile={initialProfile} isLoading={isLoading} />
    </ContentSection>
  );
}