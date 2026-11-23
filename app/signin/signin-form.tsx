"use client";

import AuthForm from "@/components/auth-form";
import { useRequest } from "@/hooks/use-request";
import { useRouter } from "next/navigation";

export default function SignInForm({ next }: { next: string }) {
  const router = useRouter();

  const { doRequest } = useRequest({
    url: "/api/users/signin",
    method: "post",
    onSuccess: () => {
      router.push(next);
    },
  });

  const handleSignIn = async (email: string, password: string) => {
    await doRequest({
      email,
      password,
    });
  };

  return (
    <AuthForm
      title="Welcome back"
      description="Enter your email and password to sign in."
      buttonText="Sign in"
      onSubmit={handleSignIn}
      mode="signin"
    />
  );
}
