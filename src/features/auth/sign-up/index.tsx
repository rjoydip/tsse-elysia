import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "~/assets/logo";
import { cn } from "~/lib/utils";
import { useAuthStore, useAuthInitialized } from "~/lib/stores/auth";
import { AnimatedPageBackground } from "~/components/animated-page-background";
import { SignUpForm } from "./components/sign-up-form";
import { APP_NAME } from "~/config";
import authBannerDark from "~/assets/auth-banner-dark.png";
import authBannerLight from "~/assets/auth-banner-light.png";

export function SignUp() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const isReady = useAuthInitialized();

  useEffect(() => {
    if (!isReady) return;
    if (authStore.accessToken && authStore.user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authStore.accessToken, authStore.user, navigate, isReady]);

  return (
    <>
      <AnimatedPageBackground />
      <div className="relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-120 sm:p-8">
            <div className="mb-4 flex items-center justify-center">
              <Logo className="me-2" />
              <Link className="text-xl font-medium" to="/">
                {APP_NAME}
              </Link>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-2">
            <div className="flex flex-col space-y-2 text-start">
              <h2 className="text-lg font-semibold tracking-tight">Create an account</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and password to create an account. <br />
                Already have an account?{" "}
                <Link to="/sign-in" className="underline underline-offset-4 hover:text-primary">
                  Sign In
                </Link>
              </p>
            </div>
            <SignUpForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By creating an account, you agree to our{" "}
              <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div
          className={cn(
            "relative h-full overflow-hidden bg-muted max-lg:hidden",
            "[&>img]:absolute [&>img]:top-[15%] [&>img]:left-20 [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:object-top-left [&>img]:select-none",
          )}
        >
          <img
            src={authBannerLight}
            className="dark:hidden"
            width={1024}
            height={1151}
            alt={`${APP_NAME}-Admin`}
          />
          <img
            src={authBannerDark}
            className="hidden dark:block"
            width={1024}
            height={1138}
            alt={`${APP_NAME}-Admin`}
          />
        </div>
      </div>
    </>
  );
}