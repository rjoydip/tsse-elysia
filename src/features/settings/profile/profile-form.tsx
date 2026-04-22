import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { settingsActions } from "~/lib/stores/settings-store";

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

type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * Profile form component for editing user profile information
 * Handles form validation, submission, and integration with settings store
 * @param {{ initialProfile: any, isLoading: boolean }} props - Component props
 */
export function ProfileForm({
  initialProfile,
  isLoading,
}: {
  initialProfile: any;
  isLoading: boolean;
}) {
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileData,
    mode: "onChange",
  });

  const { fields, append } = useFieldArray({
    name: "urls",
    control: form.control,
  });

  /**
   * Handles form submission
   * Updates settings store and submits data via API
   * @param {ProfileFormValues} data - Form data to submit
   */
  const handleSubmit = form.handleSubmit(async (data) => {
    const profileData = {
      username: data.username,
      email: data.email,
      bio: data.bio,
      urls: data.urls || [],
    };

    // Update profile in settings store
    updateProfile(profileData);

    try {
      // Submit the update
      await submitProfile(profileData);
      showSubmittedData(data);
    } catch (err) {
      // Handle error
      console.error("Failed to update profile:", err);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="email"
                  placeholder="Enter your email address"
                  readOnly={!!field.value}
                  disabled={!!field.value}
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
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
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
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>URLs</FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                    Add links to your website, blog, or social media profiles.
                  </FormDescription>
                  <FormControl className={cn(index !== 0 && "mt-1.5")}>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ value: "" })}
          >
            Add URL
          </Button>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update profile"}
        </Button>
      </form>
    </Form>
  );
}