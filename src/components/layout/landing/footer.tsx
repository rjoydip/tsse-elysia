/**
 * Common Footer Component
 * Reused across all pages for consistent footer
 * Includes links, copyright, and optional terms for auth pages
 */

import { Link } from "@tanstack/react-router";
import { APP_VERSION, APP_NAME, GITHUB_REPO_URL } from "~/config";
import { cn } from "~/lib/utils";
import { BrandLogo } from "./branding";
import { useSession } from "~/lib/auth/client";

interface FooterProps {
  className?: string;
  /** Show terms and privacy links (useful for auth pages) */
  showTerms?: boolean;
  /** Show the app logo/name */
  showLogo?: boolean;
}

export function Footer({ className, showTerms = true, showLogo = false }: FooterProps) {
  const { data: session, isPending } = useSession();
  const currentYear = new Date().getFullYear();

  /**
   * Keep the footer visible while the session query is resolving on public pages.
   * Hiding during `isPending` made public-route layout assertions flaky and caused
   * the footer to disappear indefinitely when auth bootstrap was delayed.
   */
  if (!isPending && session?.user) return null;

  return (
    <footer className={cn("py-4 px-4", className)}>
      <div className="mx-auto">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Logo and copyright */}
          <div className="flex items-center gap-3">{showLogo && <BrandLogo size="xs" />}</div>

          {/* Navigation links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link to="/changelog" className="hover:text-foreground transition-colors">
              Changelog
            </Link>
            <Link to="/status" className="hover:text-foreground transition-colors">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 mt-1 rounded-full bg-green-500 animate-pulse" />
                Status
              </span>
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                GitHub
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4">
          {/* Terms (optional - for auth pages) */}
          {showTerms && (
            <p className="text-center text-xs text-muted-foreground mb-2">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          )}

          {/* Copyright */}
          <div className="text-center text-xs text-muted-foreground">
            &copy; {currentYear} {APP_NAME}
            {APP_VERSION && <span className="ml-1">v{APP_VERSION}</span>}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}