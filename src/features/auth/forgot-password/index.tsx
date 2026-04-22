import { useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Logo } from "~/assets/logo";
import { cn } from "~/lib/utils";
import { useAuthStore, useAuthInitialized } from "~/lib/stores/auth-store";
import { AnimatedPageBackground } from "~/components/animated-page-background";
import { ForgotPasswordForm } from "./components/forgot-password-form";
import { APP_NAME } from "~/config";
import dashboardDark from "../sign-in/assets/dashboard-dark.png";
import dashboardLight from "../sign-in/assets/dashboard-light.png";

export function ForgotPassword() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const isReady = useAuthInitialized();

  useEffect(() => {
    if (!isReady) return;
    if (authStore.accessToken && authStore.user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authStore.accessToken, authStore.user, navigate, isReady]);

  if (authStore.accessToken && authStore.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnimatedPageBackground />
      <div className="relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-120 sm:p-8">
            <div className="mb-4 flex items-center justify-center">
              <Logo className="me-2" />
              <h1 className="text-xl font-medium">{APP_NAME} Admin</h1>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-2">
            <div className="flex flex-col space-y-2 text-start">
              <h2 className="text-lg font-semibold tracking-tight">Forgot Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your registered email and we will send you a link to reset your password.
              </p>
            </div>
            <ForgotPasswordForm />
            <p className="mx-auto px-8 text-center text-sm text-balance text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/sign-up" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
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
            src={dashboardLight}
            className="dark:hidden"
            width={1024}
            height={1151}
            alt="TSSE-Admin"
          />
          <img
            src={dashboardDark}
            className="hidden dark:block"
            width={1024}
            height={1138}
            alt="TSSE-Admin"
          />
        </div>
      </div>
    </>
  );
}