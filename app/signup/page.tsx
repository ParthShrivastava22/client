import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "../../lib/auth";
import SignUpForm from "./signup-form";

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
        <SignUpForm next={next} />
      </section>
    </main>
  );
}
