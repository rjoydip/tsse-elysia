import { ContentSection } from "../components/content-section";
import { ProfileForm } from "./profile-form";

/**
 * Props for SettingsProfile component
 */
interface SettingsProfileProps {
  initialProfile: ProfileData;
  isLoading: boolean;
}

/**
 * Interface for profile data received from API (includes email for display)
 */
export interface ProfileData {
  username: string;
  email: string;
  bio: string;
  urls: Array<{ value: string }>;
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