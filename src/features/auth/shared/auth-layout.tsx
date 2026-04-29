/**
 * Shared auth layout component.
 * Extracted from sign-in/index.tsx and sign-up/index.tsx to reduce duplication.
 */

import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "~/assets/logo";
import { cn } from "~/lib/utils";
import { useAuthStore, useAuthInitialized } from "~/lib/stores/auth";
import { AnimatedPageBackground } from "~/components/animated-page-background";
import authBannerDark from "~/assets/auth-banner-dark.png";
import authBannerLight from "~/assets/auth-banner-light.png";
import { APP_NAME } from "~/config";

export interface AuthLayoutProps {
  /** Page title displayed in the header */
  title: string;
  /** Description text below the title */
  description: React.ReactNode;
  /** Footer text with links to terms/privacy */
  footer: React.ReactNode;
  /** The form component to render */
  children: React.ReactNode;
}

/**
 * Shared layout for authentication pages (sign-in, sign-up).
 * Provides consistent structure with animated background, banner, and auth check.
 */
export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
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
              <Link to="/">
                <h1 className="text-xl font-medium">{APP_NAME}</h1>
              </Link>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-2">
            <div className="flex flex-col space-y-2 text-start">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
            <p className="px-8 text-center text-sm text-muted-foreground">{footer}</p>
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
            alt={`${APP_NAME}-Auth`}
          />
          <img
            src={authBannerDark}
            className="hidden dark:block"
            width={1024}
            height={1138}
            alt={`${APP_NAME}-Auth`}
          />
        </div>
      </div>
    </>
  );
}