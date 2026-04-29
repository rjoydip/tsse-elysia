import { useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuthStore, useAuthInitialized } from "~/lib/stores/auth";
import { AuthLayout } from "../auth-layout";
import { OtpForm } from "./components/otp-form";

export function Otp() {
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
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base tracking-tight">Two-factor Authentication</CardTitle>
          <CardDescription>
            Please enter the authentication code. <br /> We have sent the authentication code to
            your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Haven't received it?{" "}
            <Link to="/sign-in" className="underline underline-offset-4 hover:text-primary">
              Resend a new code.
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}