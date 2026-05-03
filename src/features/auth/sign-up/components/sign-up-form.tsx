/**
 * Sign Up Form Component
 * Uses TanStack Form with Zod validation and password strength indicators.
 * Integrates with auth client for actual registration.
 */

import { useState } from "react";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
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

export function SignUpForm({ className, redirectTo }: SignUpFormProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const navigate = useNavigate();
  const enabledProviders = getEnabledSocialProviders(env);

  const handleSocialSignIn = createHandleSocialSignIn({
    setLoadingProvider,
    authClient,
    BASE_URL,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      setLoadingProvider("email");

      try {
        const result = await signUpWithEmail(
          value.name,
          value.email,
          await encodePassword(value.password),
        );

        if (result.error) {
          const errorMessage = getAuthErrorMessage(extractAuthErrorMessage(result.error));
          toast.error(errorMessage);
          setLoadingProvider(null);
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
      } catch {
        setLoadingProvider(null);
      }
    },
  });

  // Use form.Subscribe to get password value

  return (
    <Form form={form}>
      <div className={cn("grid gap-3", className)}>
        <FormField
          name="name"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <EmailField fieldName="email" />
        <FormField
          name="password"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="********"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              {field.value && field.value.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= getPasswordStrength(field.value)
                            ? getStrengthColor(getPasswordStrength(field.value))
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs ${
                      getPasswordStrength(field.value) === 4
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {getStrengthLabel(getPasswordStrength(field.value))}
                  </p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <form.Subscribe selector={(state) => state.values.password}>
          {(password) =>
            password &&
            password.length > 0 && (
              <div className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {req.test(password) ? (
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
                      className={req.test(password) ? "text-green-600" : "text-muted-foreground"}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </form.Subscribe>
        <FormField
          name="confirmPassword"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="********"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              className="mt-2"
              disabled={isSubmitting || loadingProvider !== null}
            >
              {loadingProvider === "email" ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Create Account
            </Button>
          )}
        </form.Subscribe>

        <SocialSignIn
          enabledProviders={enabledProviders}
          loadingProvider={loadingProvider}
          handleSocialSignIn={handleSocialSignIn}
        />
      </div>
    </Form>
  );
}