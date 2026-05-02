/**
 * Email Change Form Component
 * Handles email address updates with verification.
 * Sends verification email to the new address.
 */

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSession, changeEmail } from "~/lib/auth/client";
import { Form, FormField, FormItem, FormMessage } from "~/components/ui/form";

/**
 * Email validation schema using Zod.
 * Validates email format.
 */
const emailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

/**
 * EmailChangeForm component for updating user email.
 * Validates input and handles email change flow.
 * Sends verification email to the new address.
 *
 * @example
 * <EmailChangeForm />
 */
export function EmailChangeForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      newEmail: "",
    },
    validators: {
      onChange: emailSchema,
    },
    onSubmit: async ({ value }) => {
      // Check if new email is same as current
      if (value.newEmail === session?.user?.email) {
        toast.error("New email must be different from current email");
        return;
      }

      setIsLoading(true);

      try {
        const { error: changeError } = await changeEmail(
          value.newEmail,
          `${window.location.origin}/verify-email`,
        );

        if (changeError) {
          toast.error(changeError.message || "Failed to change email");
          setIsLoading(false);
          return;
        }

        // Clear form and show success
        form.reset();
        setIsLoading(false);
        toast.success("Verification email sent! Please check your new email address.");
        // oxlint-disable-next-line no-unused-vars
      } catch (_err) {
        toast.error("An unexpected error occurred");
        setIsLoading(false);
      }
    },
  });

  return (
    <Form form={form}>
      <div className="space-y-4">
        {/* Current email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="currentEmail">Current Email</Label>
          <Input
            id="currentEmail"
            type="email"
            defaultValue={session?.user?.email ?? ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">This is your current email address</p>
        </div>

        {/* New email */}
        <FormField
          name="newEmail"
          children={({ field }) => (
            <FormItem>
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Enter new email address"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                disabled={isLoading}
                autoComplete="email"
              />
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                A verification email will be sent to this address
              </p>
            </FormItem>
          )}
        />

        {/* Submit button */}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending verification...
                </>
              ) : (
                "Send Verification Email"
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}