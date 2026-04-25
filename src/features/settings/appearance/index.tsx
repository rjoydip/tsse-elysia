import { ContentSection } from "../components/content-section";
import { AppearanceForm } from "./appearance-form";

/**
 * Appearance settings page component.
 */
export function SettingsAppearance() {
  return (
    <ContentSection
      title="Appearance"
      desc="Customize the appearance of the app. Automatically switch between day
          and night themes."
    >
      <AppearanceForm />
    </ContentSection>
  );
}