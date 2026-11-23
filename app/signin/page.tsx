import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "../../lib/auth";
import SignInForm from "./signin-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) {
    redirect(next);
  }

  const buying = next.startsWith("/cart") || next.startsWith("/checkout");

  return (
    <main className="px-app">
      <section className="px-panel px-auth">
        <h1 className="px-title">Sign in</h1>

        {buying && (
          <p className="px-notice">Sign in to continue your purchase.</p>
        )}

        <SignInForm next={next} />

        <p className="px-demo">
          Demo: pixelhollow@demo.dev / demo1234 owns the sample listings. Other
          sample creators use the same password.
        </p>
      </section>
    </main>
  );
}
