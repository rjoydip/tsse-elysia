import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { z } from "zod";
import { useSession } from "~/lib/auth/client";
import { showSubmittedData } from "~/components/show-submitted-data";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { settingsActions } from "~/lib/stores/dashboard/settings";
import type { ProfileData } from ".";

/**
 * Interface for profile data sent to API (email excluded - managed via auth)
 */
export interface ApiProfileData {
  username: string;
  bio: string;
  urls: Array<{ value: string }>;
}

/**
 * Props for ProfileForm component
 */
interface ProfileFormProps {
  initialProfile: ProfileData;
  isLoading: boolean;
}

/**
 * Schema for validating profile form data
 */
const profileFormSchema = z.object({
  /**
   * Username must be 2-30 characters
   */
  username: z
    .string("Please enter your username.")
    .min(2, "Username must be at least 2 characters.")
    .max(30, "Username must not be longer than 30 characters."),
  /**
   * Email must be a valid email address
   */
  email: z.email({
    error: (iss) => (iss.input === undefined ? "Please select an email to display." : undefined),
  }),
  /**
   * Bio must be 0-160 characters
   */
  bio: z.string().max(160),
  /**
   * Array of URLs, each must be a valid URL
   */
  urls: z
    .array(
      z.object({
        value: z.url("Please enter a valid URL."),
      }),
    )
    .optional(),
});

/**
 * Profile form component for editing user profile information
 * Handles form validation, submission, and integration with settings store
 * @param {ProfileFormProps} props - Component props
 */
export function ProfileForm({ initialProfile, isLoading }: ProfileFormProps) {
  const { data: session } = useSession();
  const { updateProfile, submitProfile } = settingsActions;

  const profileData = useMemo(
    () => ({
      username: initialProfile?.username ?? session?.user?.name ?? "",
      email: initialProfile?.email ?? session?.user?.email ?? "",
      bio: initialProfile?.bio ?? "",
      urls: initialProfile?.urls ?? [],
    }),
    [initialProfile, session],
  );

  const form = useForm({
    defaultValues: profileData,
    validators: {
      onChange: profileFormSchema as any,
    },
    onSubmit: async ({ value }) => {
      const profileData = {
        username: value.username,
        bio: value.bio,
        urls: value.urls || [],
      };

      // Update profile in settings store (includes email from form for display)
      updateProfile({
        ...profileData,
        email: value.email,
      });

      try {
        // Submit the update (email excluded - read-only, managed via auth)
        await submitProfile(profileData as ApiProfileData);
        showSubmittedData(value);
      } catch (err) {
        // Handle error with user feedback
        console.error("Failed to update profile:", err);
      }
    },
  });

  // Manage URLs array using useStore for reactive updates
  const urls = useStore(form.baseStore, (state) => state.values.urls || []);

  const appendUrl = () => {
    const currentUrls = form.state.values.urls || [];
    form.setFieldValue("urls", [...currentUrls, { value: "" }]);
  };

  const removeUrl = (index: number) => {
    const currentUrls = form.state.values.urls || [];
    form.setFieldValue(
      "urls",
      currentUrls.filter((_, i) => i !== index),
    );
  };

  return (
    <Form form={form}>
      <div className="space-y-8">
        <FormField
          name="username"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="username"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="email"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  value={field.value ?? ""}
                  type="email"
                  placeholder="Enter your email address"
                  readOnly={!!field.value}
                  disabled={!!field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                {field.value ? (
                  "Email is managed in your account settings."
                ) : (
                  <>
                    You can manage verified email addresses in your{" "}
                    <Link to="/dashboard/settings">account settings</Link>.
                  </>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="bio"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {urls.map((_, index) => (
            <FormField
              key={index}
              name={`urls[${index}].value`}
              children={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>URLs</FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                    Add links to your website, blog, or social media profiles.
                  </FormDescription>
                  <div className="flex gap-2">
                    <FormControl className={cn(index !== 0 && "mt-1.5")}>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeUrl(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={appendUrl}>
            Add URL
          </Button>
        </div>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? "Updating..." : "Update profile"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}