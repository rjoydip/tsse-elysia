/**
 * Sign Up Form Component
 * Uses react-hook-form with Zod validation and password strength indicators.
 * Integrates with auth client for actual registration.
 */

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient, signUpWithEmail } from "~/lib/auth/client";
import { authActions } from "~/lib/stores/auth";
import { env } from "~/config/env";
import { getEnabledSocialProviders } from "~/config/auth";
import { cn } from "~/lib/utils";
import { encodePassword } from "~/lib/utils/encryption";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { BASE_URL } from "~/config";
import {
  extractAuthErrorMessage,
  getAuthErrorMessage,
} from "~/features/auth/shared/auth-error-utils";
import { createHandleSocialSignIn } from "~/features/auth/shared/handle-social-sign-in";
import { EmailField } from "~/features/auth/shared/components/email-field";
import { SocialSignIn } from "~/features/auth/shared/components/social-sign-in";

interface PasswordRequirement {
  label: string;
  test: (pwd: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd) => /[0-9]/.test(pwd) },
];

const PASSWORD_REQUIREMENTS_LABELS: Record<number, string> = {
  0: "Weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email({
      error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
    }),
    password: z
      .string()
      .min(1, "Please enter your password")
      .refine((pwd) => pwd.length >= 8, { message: "At least 8 characters" })
      .refine((pwd) => /[A-Z]/.test(pwd), { message: "One uppercase letter" })
      .refine((pwd) => /[a-z]/.test(pwd), { message: "One lowercase letter" })
      .refine((pwd) => /[0-9]/.test(pwd), { message: "One number" }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

const getPasswordStrength = (pwd: string): number => {
  return PASSWORD_REQUIREMENTS.filter((req) => req.test(pwd)).length;
};

const getStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "bg-destructive";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-blue-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-muted";
  }
};

const getStrengthLabel = (score: number): string => {
  return PASSWORD_REQUIREMENTS_LABELS[score] ?? "";
};

interface SignUpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function SignUpForm({ className, redirectTo, ...props }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const navigate = useNavigate();
  const enabledProviders = getEnabledSocialProviders(env);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSocialSignIn = createHandleSocialSignIn({
    setLoadingProvider,
    authClient,
    BASE_URL,
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLoadingProvider("email");

    try {
      const result = await signUpWithEmail(
        data.name,
        data.email,
        await encodePassword(data.password),
      );

      if (result.error) {
        const errorMessage = getAuthErrorMessage(extractAuthErrorMessage(result.error));
        toast.error(errorMessage);
        return;
      }

      if (result.data?.user) {
        const user = result.data.user;
        const mockUser = {
          accountNo: user.id || "ACC001",
          email: user.email,
          role: ["user"],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        };
        authActions.setUser(mockUser);
        authActions.setAccessToken("auth-access-token");
        toast.success("Account created successfully");
        const targetPath = redirectTo || "/dashboard";
        navigate({ to: targetPath, replace: true });
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }

  const passwordValue = form.watch("password");

  return (
    <Form {...form}>
      <div className={cn("grid gap-3", className)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3" {...props}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <EmailField form={form} fieldName="email" />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                {passwordValue.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= getPasswordStrength(passwordValue)
                              ? getStrengthColor(getPasswordStrength(passwordValue))
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs ${
                        getPasswordStrength(passwordValue) === 4
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {getStrengthLabel(getPasswordStrength(passwordValue))}
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          {passwordValue.length > 0 && (
            <div className="space-y-1">
              {PASSWORD_REQUIREMENTS.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {req.test(passwordValue) ? (
                    <svg
                      className="w-4 h-4 text-green-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                  )}
                  <span
                    className={req.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="mt-2" disabled={isLoading}>
            {loadingProvider === "email" ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Create Account
          </Button>
        </form>

        <SocialSignIn
          enabledProviders={enabledProviders}
          loadingProvider={loadingProvider}
          handleSocialSignIn={handleSocialSignIn}
        />
      </div>
    </Form>
  );
}