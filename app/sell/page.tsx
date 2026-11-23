// app/sell/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "../../lib/auth";
import { createListingAction } from "./actions";
import { ListingForm } from "../../components/listing-form";

export default async function SellPage() {
  if (!(await getCurrentUser())) redirect(loginUrl("/sell"));
  return (
    <main className="px-app">
      <Link href="/sell/listings" className="px-muted">
        Back to my listings
      </Link>
      <h1 className="px-title" style={{ marginTop: "0.75rem" }}>
        New listing
      </h1>
      <div className="px-panel" style={{ maxWidth: 680 }}>
        <p className="px-demo">
          Demo: listings and images are kept in memory and reset when the server
          restarts.
        </p>
        <ListingForm action={createListingAction} />
      </div>
    </main>
  );
}
