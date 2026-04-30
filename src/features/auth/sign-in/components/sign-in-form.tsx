/**
 * Sign In Form Component
 * Uses react-hook-form for state management with Zod validation.
 * Integrates with auth client for actual authentication.
 */

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { authClient, signInWithEmail, useSession } from "~/lib/auth/client";
import { authActions } from "~/lib/stores/auth";
import { env } from "~/config/env";
import { getEnabledSocialProviders } from "~/config/auth";
import { cn } from "~/lib/utils";
import { encodePassword } from "~/lib/utils/encryption";
import { Button } from "~/components/ui/button";
import { PasswordInput } from "~/components/password-input";
import { EmailField } from "~/features/auth/shared/components/email-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { BASE_URL } from "~/config";
import { createHandleSocialSignIn } from "~/features/auth/shared/handle-social-sign-in";
import { extractAuthErrorMessage } from "~/features/auth/shared/auth-error-utils";

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
  }),
  password: z.string().min(1, "Password is required"),
});

interface SignInFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function SignInForm({ className, redirectTo, ...props }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const navigate = useNavigate();
  const enabledProviders = getEnabledSocialProviders(env);
  useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
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
      const result = await signInWithEmail(data.email, await encodePassword(data.password));
      if (result.error) {
        toast.error(extractAuthErrorMessage(result.error));
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
    } catch (error) {
      toast.error(extractAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }

  const targetPath = redirectTo || "/dashboard";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        <EmailField form={form} fieldName="email" />
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
        <Button className="mt-2" disabled={isLoading} type="submit">
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
    </Form>
  );
}