import { SignInForm } from "./components/sign-in-form";
import { AuthLayout } from "~/features/auth/shared/auth-layout";
import { Link } from "@tanstack/react-router";

export function SignIn() {
  return (
    <AuthLayout
      title="Sign in"
      description={
        <>
          Enter your email and password below to log into your account. <br />
          Don't have an account?{" "}
          <Link to="/sign-up" className="underline underline-offset-4 hover:text-primary">
            Sign Up
          </Link>
        </>
      }
      footer={
        <>
          By clicking sign in, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </>
      }
    >
      <SignInForm />
    </AuthLayout>
  );
}