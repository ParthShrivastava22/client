// app/sell/[id]/edit/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "../../../../lib/auth";
import { getOwnAsset } from "../../../../lib/api/assets";
import { updateListingAction } from "../../actions";
import { ListingForm } from "../../../../components/listing-form";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(`/sell/${id}/edit`));
  const asset = await getOwnAsset(user.id, id);
  if (!asset) notFound(); // also what other people’s listings return, so existence isn’t leaked

  return (
    <main className="px-app">
      <Link href="/sell/listings" className="px-muted">
        Back to my listings
      </Link>
      <h1 className="px-title" style={{ marginTop: "0.75rem" }}>
        Edit listing
      </h1>
      <div className="px-panel" style={{ maxWidth: 680 }}>
        {asset.soldCount > 0 && (
          <p className="px-demo">
            {asset.soldCount} sold. Price changes only affect future buyers, and
            the limit can’t go below {asset.soldCount}.
          </p>
        )}
        <ListingForm
          action={updateListingAction.bind(null, asset.id)}
          initial={asset}
        />
      </div>
    </main>
  );
}
