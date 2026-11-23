"use client";

import AuthForm from "@/components/auth-form";
import { useRequest } from "@/hooks/use-request";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  const { doRequest } = useRequest({
    url: "/api/users/signup",
    method: "post",
    onSuccess: () => {
      console.log("Signup successful!");
      router.push("/landing");
    },
  });

  const handleSignUp = async (email: string, password: string) => {
    await doRequest({
      email,
      password,
    });
  };

  return (
    <AuthForm
      title="Create an account"
      description="Enter your email and password to create your account."
      buttonText="Sign up"
      onSubmit={handleSignUp}
    />
  );
}
