/**
 * OTP Form Component
 * Uses react-hook-form with Zod validation.
 * Handles OTP verification for two-factor authentication.
 */

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  });

  const otp = form.watch("otp");

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    if (data.otp.length === 6) {
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

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-2", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">One-Time Password</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  {...field}
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
        <Button className="mt-2" disabled={otp.length < 6 || isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          Verify
        </Button>
      </form>
    </Form>
  );
}