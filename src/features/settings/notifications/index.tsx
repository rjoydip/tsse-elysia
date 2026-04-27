import { ContentSection } from "../components/content-section";
import { NotificationsForm } from "./notifications-form";
import { NotificationData } from "~/lib/stores/dashboard/settings";

/**
 * Notifications settings page component.
 * @param {{ initialNotifications: NotificationData | null; isLoading: boolean }} props - Component props
 */
export function SettingsNotifications({
  initialNotifications,
  isLoading,
}: {
  initialNotifications: NotificationData | null;
  isLoading: boolean;
}) {
  return (
    <ContentSection title="Notifications" desc="Configure how you receive notifications.">
      <NotificationsForm initialNotifications={initialNotifications} isLoading={isLoading} />
    </ContentSection>
  );
}