import { z } from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { showSubmittedData } from "~/components/show-submitted-data";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Switch } from "~/components/ui/switch";
import { settingsActions } from "~/lib/stores/settings-store";

/**
 * Schema for validating notifications form data.
 */
const notificationsFormSchema = z.object({
  /**
   * Notification type preference
   */
  type: z.enum(["all", "mentions", "none"], {
    error: (iss) => (iss.input === undefined ? "Please select a notification type." : undefined),
  }),
  /**
   * Mobile notifications toggle
   */
  mobile: z.boolean(),
  /**
   * Communication emails toggle
   */
  communication_emails: z.boolean(),
  /**
   * Social emails toggle
   */
  social_emails: z.boolean(),
  /**
   * Marketing emails toggle
   */
  marketing_emails: z.boolean(),
  /**
   * Security emails (always required)
   */
  security_emails: z.boolean(),
});

/**
 * Type for notifications form values inferred from schema.
 */
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

/**
 * Default values for notifications settings.
 */
const defaultValues: NotificationsFormValues = {
  type: "all",
  mobile: false,
  communication_emails: false,
  marketing_emails: false,
  social_emails: true,
  security_emails: true,
};

/**
 * Notifications settings form component.
 * Allows users to configure notification preferences.
 * @param {{ initialNotifications: NotificationsFormValues | null; isLoading: boolean }} props - Component props
 */
export function NotificationsForm({
  initialNotifications,
  isLoading,
}: {
  initialNotifications: NotificationsFormValues | null;
  isLoading: boolean;
}) {
  const { updateNotifications, submitNotifications } = settingsActions;

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
  });

  // Update form values when initialNotifications changes
  useEffect(() => {
    const formValues: NotificationsFormValues = initialNotifications ?? defaultValues;
    form.reset(formValues);
  }, [initialNotifications, form]);

  /**
   * Handles form submission.
   * @param {NotificationsFormValues} data - Form data to submit
   */
  const handleSubmit = form.handleSubmit((data) => {
    updateNotifications(data);
    submitNotifications(data);
    showSubmittedData(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="relative space-y-3">
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col gap-2"
                >
                  <FormItem className="flex items-center">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">All new messages</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center">
                    <FormControl>
                      <RadioGroupItem value="mentions" />
                    </FormControl>
                    <FormLabel className="font-normal">Direct messages and mentions</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center">
                    <FormControl>
                      <RadioGroupItem value="none" />
                    </FormControl>
                    <FormLabel className="font-normal">Nothing</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="relative">
          <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="communication_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Communication emails</FormLabel>
                    <FormDescription>Receive emails about your account activity.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing emails</FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Social emails</FormLabel>
                    <FormDescription>
                      Receive emails for friend requests, follows, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="security_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Security emails</FormLabel>
                    <FormDescription>
                      Receive emails about your account activity and security.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="relative flex flex-row items-start">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Use different settings for my mobile devices</FormLabel>
                <FormDescription>
                  You can manage your mobile notifications in the{" "}
                  <Link
                    to="/dashboard/settings"
                    className="underline decoration-dashed underline-offset-4 hover:decoration-solid"
                  >
                    mobile settings
                  </Link>{" "}
                  page.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update notifications"}
        </Button>
      </form>
    </Form>
  );
}