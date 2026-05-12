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
import { authClient, getCurrentUser, signUpWithEmail } from "~/lib/auth/client";
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
import {
  PASSWORD_REQUIREMENTS,
  getPasswordStrength,
  getStrengthColor,
  getStrengthLabel,
} from "~/features/auth/shared/password-utils";

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email({
      error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
    }),
    username: z.string().optional(),
    role: z.string().optional(),
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

          // Parse name into firstName and lastName
          const nameParts = value.name.trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
          const username = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

          // Update user profile with firstName, lastName, and username
          await fetch("/api/users/me/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              firstName,
              lastName,
              username,
            }),
          });

          const userResult = await getCurrentUser();
          const userRole = userResult.data?.role || "user";

          authActions.setUser({
            accountNo: user.id || "ACC001",
            email: user.email,
            role: [userRole],
            exp: Date.now() + 24 * 60 * 60 * 1000,
          });
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
              <form.Subscribe
                selector={(state) => [state.values.password, state.values.confirmPassword]}
              >
                {([password, confirmPwd]) => {
                  if (!confirmPwd || confirmPwd.length === 0) return null;
                  const passwordsMatch = confirmPwd === password;
                  return (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      {passwordsMatch ? (
                        <svg
                          className="w-3 h-3 text-green-500 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3 text-red-500 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      <span className={passwordsMatch ? "text-green-600" : "text-red-500"}>
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    </div>
                  );
                }}
              </form.Subscribe>
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