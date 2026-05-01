import { SignUpForm } from "./components/sign-up-form";
import { AuthLayout } from "~/features/auth/shared/auth-layout";
import { Link } from "@tanstack/react-router";

export function SignUp() {
  return (
    <AuthLayout
      title="Create an account"
      description={
        <>
          Enter your email and password to create an account. <br />
          Already have an account?{" "}
          <Link to="/sign-in" className="underline underline-offset-4 hover:text-primary">
            Sign In
          </Link>
        </>
      }
      footer={
        <>
          By creating an account, you agree to our{" "}
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
      <SignUpForm />
    </AuthLayout>
  );
}