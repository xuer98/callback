import type { Metadata } from "next";
import { SignInForm } from "@/components/signin-form";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <SignInForm googleEnabled={googleEnabled} />
    </div>
  );
}
