import { ContentSection } from "../components/content-section";
import { ProfileForm, type ProfileData } from "./profile-form";

/**
 * Props for SettingsProfile component
 */
interface SettingsProfileProps {
  initialProfile: ProfileData;
  isLoading: boolean;
}

/**
 * Profile settings page component.
 * Displays the profile form for users to edit their information.
 * @param {SettingsProfileProps} props - Component props
 */
export function SettingsProfile({ initialProfile, isLoading }: SettingsProfileProps) {
  return (
    <ContentSection title="Profile" desc="This is how others will see you on the site.">
      <ProfileForm initialProfile={initialProfile} isLoading={isLoading} />
    </ContentSection>
  );
}