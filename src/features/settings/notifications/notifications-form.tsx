import { z } from "zod";
import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
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
import { settingsActions } from "~/lib/stores/dashboard/settings";

/**
 * Type for notifications form values inferred from schema.
 */
type NotificationsFormValues = {
  type: "all" | "mentions" | "none";
  mobile: boolean;
  communication_emails: boolean;
  social_emails: boolean;
  marketing_emails: boolean;
  security_emails: boolean;
};

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

  const form = useForm({
    defaultValues: defaultValues,
    validators: {
      onChange: notificationsFormSchema as any,
    },
    onSubmit: async ({ value }) => {
      updateNotifications(value);
      submitNotifications(value);
      showSubmittedData(value);
    },
  });

  // Update form values when initialNotifications changes
  useEffect(() => {
    const formValues: NotificationsFormValues = initialNotifications ?? defaultValues;
    form.setFieldValue("type", formValues.type);
    form.setFieldValue("mobile", formValues.mobile);
    form.setFieldValue("communication_emails", formValues.communication_emails);
    form.setFieldValue("marketing_emails", formValues.marketing_emails);
    form.setFieldValue("social_emails", formValues.social_emails);
    form.setFieldValue("security_emails", formValues.security_emails);
  }, [initialNotifications]);

  return (
    <Form form={form}>
      <div className="space-y-8">
        <FormField
          name="type"
          children={({ field }) => (
            <FormItem className="relative space-y-3">
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
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
              name="communication_emails"
              children={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Communication emails</FormLabel>
                    <FormDescription>Receive emails about your account activity.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="marketing_emails"
              children={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing emails</FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="social_emails"
              children={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Social emails</FormLabel>
                    <FormDescription>
                      Receive emails for friend requests, follows, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="security_emails"
              children={({ field }) => (
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
                      onCheckedChange={(checked) => field.onChange(checked)}
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
          name="mobile"
          children={({ field }) => (
            <FormItem className="relative flex flex-row items-start">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
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
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? "Updating..." : "Update notifications"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}