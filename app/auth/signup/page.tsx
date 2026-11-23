import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "../../../lib/auth";
import AuthForm from "../../../components/auth-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) {
    redirect(next);
  }

  return (
    <main className="px-app">
      <section className="px-panel px-auth">
        <h1 className="px-title">Create your account</h1>

        <p className="px-muted" style={{ marginTop: "-0.75rem" }}>
          One account lets you buy assets and sell your own.
        </p>

        <AuthForm mode="signup" next={next} />
      </section>
    </main>
  );
}
