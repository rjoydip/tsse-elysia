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
import { getEnabledSocialProviders, type AuthProviderId } from "~/config/auth";
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

/**
 * Extracts a readable signup error message from unknown client/server error shapes.
 * Better Auth can return different payload structures depending on transport/runtime.
 *
 * @param error - Unknown error payload or thrown error
 * @returns Normalized raw message before UX-specific mapping
 */
const extractRegisterErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: string;
      error?: { message?: string } | string;
      body?: { message?: string };
    };
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
    if (typeof maybeError.error === "string") {
      return maybeError.error;
    }
    if (maybeError.error && typeof maybeError.error === "object") {
      const nestedError = maybeError.error as { message?: string };
      if (typeof nestedError.message === "string") {
        return nestedError.message;
      }
    }
    if (maybeError.body && typeof maybeError.body.message === "string") {
      return maybeError.body.message;
    }
  }
  return "Failed to create account";
};

/**
 * Maps Better Auth signup errors to user-friendly toast messages.
 * Normalizes common duplicate-account responses from different runtimes/providers.
 *
 * @param errorMessage - Raw backend/client error text
 * @returns Human-friendly error message for registration failures
 */
const getRegisterErrorMessage = (errorMessage?: string): string => {
  const normalizedMessage = (errorMessage ?? "").toLowerCase();
  if (
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("user exists") ||
    normalizedMessage.includes("email has already been used")
  ) {
    return "User already exists. Use another email";
  }
  return errorMessage || "Failed to create account";
};

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
  const [loadingProvider, setLoadingProvider] = useState<AuthProviderId | "email" | null>(null);
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

  async function handleSocialSignIn(provider: AuthProviderId) {
    setLoadingProvider(provider);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: `${BASE_URL}/dashboard`,
      });
      if (result.error) {
        toast.error(extractRegisterErrorMessage(result.error));
      }
    } catch (error) {
      toast.error(extractRegisterErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  }

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
        const errorMessage = getRegisterErrorMessage(extractRegisterErrorMessage(result.error));
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
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

        {enabledProviders.length > 0 && (
          <>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div
              className={cn("grid gap-2", {
                "grid-cols-2": enabledProviders.length > 1,
                "grid-cols-1": enabledProviders.length === 1,
              })}
            >
              {enabledProviders.map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  type="button"
                  className="border-2"
                  disabled={loadingProvider !== null}
                  onClick={() => handleSocialSignIn(provider.id)}
                >
                  {loadingProvider === provider.id ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <provider.icon className="h-4 w-4 mr-2" />
                  )}{" "}
                  {provider.name}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </Form>
  );
}