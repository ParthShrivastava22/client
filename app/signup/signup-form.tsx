"use client";

import AuthForm from "@/components/auth-form";
import { useRequest } from "@/hooks/use-request";
import { useRouter } from "next/navigation";

export default function SignUpForm({ next }: { next: string }) {
  const router = useRouter();

  const { doRequest } = useRequest({
    url: "/api/users/signup",
    method: "post",
    onSuccess: () => {
      router.push(next);
    },
  });

  const handleSignUp = async (email: string, password: string) => {
    await doRequest({
      email,
      password,
    });
  };

  return (
    <>
      <AuthForm
        title="Create your account"
        description="One account lets you buy assets and sell your own."
        buttonText="Sign up"
        onSubmit={handleSignUp}
        mode="signup"
      />
    </>
  );
}
