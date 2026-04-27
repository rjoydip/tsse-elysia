/**
 * Preferences Settings Component
 * Handles user preference settings like theme and notifications.
 * Provides toggles for various user preferences.
 * Uses centralized TanStack store for state management.
 */

import { usePreferences, setPreferences } from "~/lib/stores/dashboard/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

/**
 * PreferencesSettings component for user preferences.
 * Displays theme and notification settings.
 * Reads from and writes to centralized preferences store.
 *
 * @example
 * <PreferencesSettings />
 */
export function PreferencesSettings() {
  const preferences = usePreferences();

  return (
    <div className="space-y-6">
      {/* Notifications settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email notifications toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications" className="text-base">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important account activity
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => setPreferences({ emailNotifications: checked })}
            />
          </div>

          {/* Marketing emails toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails" className="text-base">
                Marketing Emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new features and promotions
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) => setPreferences({ marketingEmails: checked })}
            />
          </div>

          {/* Session alerts toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sessionAlerts" className="text-base">
                Session Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a new session is created on your account
              </p>
            </div>
            <Switch
              id="sessionAlerts"
              checked={preferences.sessionAlerts}
              onCheckedChange={(checked) => setPreferences({ sessionAlerts: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Customize your display preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Theme settings are managed through the theme toggle in the header.
          </p>
        </CardContent>
      </Card>

      {/* Privacy settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Manage your privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile visibility */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users
              </p>
            </div>
            <Switch
              checked={preferences.profileVisibility}
              onCheckedChange={(checked) => setPreferences({ profileVisibility: checked })}
            />
          </div>

          {/* Activity status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Activity Status</Label>
              <p className="text-sm text-muted-foreground">
                Show when you are online to other users
              </p>
            </div>
            <Switch
              checked={preferences.activityStatus}
              onCheckedChange={(checked) => setPreferences({ activityStatus: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}