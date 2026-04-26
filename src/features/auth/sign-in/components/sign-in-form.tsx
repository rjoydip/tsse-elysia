/**
 * Sign In Form Component
 * Uses react-hook-form for state management with Zod validation.
 * Integrates with auth client for actual authentication.
 */

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { authClient, signInWithEmail, useSession } from "~/lib/auth/client";
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

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
  }),
  password: z.string().min(1, "Password is required"),
});

/**
 * Extracts a readable sign-in error message from unknown client/server error shapes.
 * Better Auth can return different payload structures depending on transport/runtime.
 */
const extractLoginErrorMessage = (error: unknown): string => {
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
  return "Failed to sign in";
};

interface SignInFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function SignInForm({ className, redirectTo, ...props }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<AuthProviderId | "email" | null>(null);
  const navigate = useNavigate();
  const enabledProviders = getEnabledSocialProviders(env);
  const { data: session } = useSession();

  const targetPath = redirectTo || "/dashboard";

  // If we already have a session (e.g. after OAuth redirect), redirect to target
  useEffect(() => {
    if (session?.user) {
      navigate({ to: targetPath, replace: true });
    }
  }, [session, navigate, targetPath]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
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
        toast.error(extractLoginErrorMessage(result.error));
      }
    } catch (error) {
      toast.error(extractLoginErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLoadingProvider("email");

    try {
      const result = await signInWithEmail(data.email, await encodePassword(data.password));
      if (result.error) {
        toast.error(extractLoginErrorMessage(result.error));
        return;
      }

      if (result.data?.user) {
        const user = result.data.user;
        authActions.setUser({
          accountNo: user.id || "ACC001",
          email: user.email,
          role: ["user"],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        });
        authActions.setAccessToken("auth-access-token");
        toast.success("Signed in successfully");
        navigate({ to: targetPath, replace: true });
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }

  return (
    <Form {...form}>
      <div className={cn("grid gap-3", className)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3" {...props}>
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
              <FormItem className="relative">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
                <Link
                  to="/forgot-password"
                  className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
                >
                  Forgot password?
                </Link>
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Do not have an account?</span>
            <Link
              to="/sign-up"
              className="text-sm font-medium text-muted-foreground hover:opacity-75"
            >
              Sign up
            </Link>
          </div>
          <Button type="submit" className="mt-2" disabled={isLoading}>
            {loadingProvider === "email" ? <Loader2 className="animate-spin" /> : <LogIn />}
            Sign in
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