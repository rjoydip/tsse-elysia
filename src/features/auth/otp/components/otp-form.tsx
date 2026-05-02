/**
 * OTP Form Component
 * Uses TanStack Form with Zod validation.
 * Handles OTP verification for two-factor authentication.
 */

import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authActions } from "~/lib/stores/auth";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "~/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

const formSchema = z.object({
  otp: z.string().min(6, "Please enter the 6-digit code.").max(6, "Please enter the 6-digit code."),
});

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>;

export function OtpForm({ className }: OtpFormProps) {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: { otp: "" },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.otp.length === 6) {
        const mockUser = {
          accountNo: "ACC001",
          email: "verified@example.com",
          role: ["user"],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        };
        authActions.setUser(mockUser);
        authActions.setAccessToken("verified-access-token");

        toast.success("Verification successful");
        navigate({ to: "/dashboard" });
      }
    },
  });

  // Use form.Subscribe to get OTP value

  return (
    <Form form={form}>
      <div className={cn("grid gap-2", className)}>
        <FormField
          name="otp"
          children={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">One-Time Password</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  containerClassName="justify-center sm:[&>[data-slot=input-otp-group]>div]:w-12"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <form.Subscribe
          selector={(state) => ({ isSubmitting: state.isSubmitting, otp: state.values.otp || "" })}
        >
          {({ isSubmitting, otp }) => (
            <Button className="mt-2" disabled={otp.length < 6 || isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              Verify
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}