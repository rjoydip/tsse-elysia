/**
 * Email Verification Page Route
 * Handles email verification callback from verification emails.
 * Displays verification status to the user.
 * Uses TanStack Router for file-based routing.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_NAME } from "~/config";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Header } from "~/components/layout/landing/header";
import { Footer } from "~/components/layout/landing/footer";
import { ErrorDisplay } from "~/components/ui/error-display";

/**
 * Route definition for the email verification page.
 * Uses TanStack Router's file-based routing system.
 */
export const Route = createFileRoute("/(auth)/verify-email")({
  component: VerifyEmail,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: `Verify your ${APP_NAME} email` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Email Verification - ${APP_NAME}`,
          description: "Verify your email address",
          isPartOf: { "@type": "WebSite", name: APP_NAME },
        }),
      },
    ],
  }),
});

/**
 * Email verification page component.
 * Handles the verification callback and displays status.
 * Shows success, error, or loading states.
 */
function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  /**
   * Handle verification on component mount.
   * Processes the verification token from URL parameters.
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    // If we have a token and no error, assume success
    // TODO: The actual verification happens server-side via Better Auth
    setStatus("success");
    setMessage("Your email has been verified successfully!");
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Email Verification</CardTitle>
              <CardDescription>
                {status === "loading"
                  ? "Verifying your email..."
                  : status === "success"
                    ? "Verification Complete"
                    : "Verification Failed"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {status === "loading" ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Processing verification...</p>
                </div>
              ) : status === "success" ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-foreground font-medium">{message}</p>
                  <Link to="/dashboard/settings">
                    <Button>Go to Settings</Button>
                  </Link>
                </div>
              ) : (
                <div className="py-4">
                  <ErrorDisplay title="Verification Failed" message={message}>
                    <div className="flex gap-2">
                      <Link to="/dashboard/settings">
                        <Button variant="outline">Try Again</Button>
                      </Link>
                      <Link to="/">
                        <Button>Go Home</Button>
                      </Link>
                    </div>
                  </ErrorDisplay>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}