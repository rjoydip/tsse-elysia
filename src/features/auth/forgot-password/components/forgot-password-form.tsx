/**
 * Forgot Password Form Component
 * Uses TanStack Form with Zod validation.
 * Integrates with auth client for password reset.
 */

import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordReset } from "~/lib/auth/client";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { EmailField } from "~/features/auth/shared/components/email-field";
import { Form } from "~/components/ui/form";

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
  }),
});

export function ForgotPasswordForm({ className }: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await sendPasswordReset(value.email);
        if (result.error) {
          const message = result.error?.message ?? "Failed to send reset email";
          toast.error(message);
          return;
        }
        toast.success("Reset link sent. Please check your email.");
        navigate({ to: "/otp", replace: true });
      } catch {
        toast.error("An unexpected error occurred");
      }
    },
  });

  return (
    <Form form={form}>
      <div className={cn("grid gap-2", className)}>
        <EmailField fieldName="email" />
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button className="mt-2" disabled={isSubmitting}>
              Continue
              {isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}