/**
 * Password Change Form Component
 * Handles password updates with validation.
 * Requires current password for security verification.
 */

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { changePassword } from "~/lib/auth/client";
import { Form, FormField, FormItem, FormMessage } from "~/components/ui/form";

/**
 * Password validation schema using Zod.
 * Enforces minimum length and complexity requirements.
 */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * PasswordChangeForm component for updating user password.
 * Validates input and handles password change flow.
 *
 * @example
 * <PasswordChangeForm />
 */
export function PasswordChangeForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onChange: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);

      try {
        const { error: changeError } = await changePassword(
          value.currentPassword,
          value.newPassword,
        );

        if (changeError) {
          toast.error(changeError.message || "Failed to change password");
          setIsLoading(false);
          return;
        }

        // Clear form and show success
        form.reset();
        setIsLoading(false);
        toast.success("Password changed successfully!");
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
        {/* Current password */}
        <FormField
          name="currentPassword"
          children={({ field }) => (
            <FormItem>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New password */}
        <FormField
          name="newPassword"
          children={({ field }) => (
            <FormItem>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </FormItem>
          )}
        />

        {/* Confirm new password */}
        <FormField
          name="confirmPassword"
          children={({ field }) => (
            <FormItem>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <FormMessage />
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
                  Changing password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}