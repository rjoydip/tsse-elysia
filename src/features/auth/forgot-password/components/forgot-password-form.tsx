/**
 * Forgot Password Form Component
 * Uses react-hook-form with Zod validation.
 * Integrates with auth client for password reset.
 */

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export function ForgotPasswordForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const result = await sendPasswordReset(data.email);
      if (result.error) {
        const message = result.error?.message ?? "Failed to send reset email";
        toast.error(message);
        return;
      }
      toast.success("Reset link sent. Please check your email.");
      navigate({ to: "/otp", replace: true });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-2", className)}
        {...props}
      >
        <EmailField form={form} fieldName="email" />
        <Button className="mt-2" disabled={isLoading}>
          Continue
          {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        </Button>
      </form>
    </Form>
  );
}