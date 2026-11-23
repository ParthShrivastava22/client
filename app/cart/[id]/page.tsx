import Link from "next/link";
import { notFound } from "next/navigation";
import { getAsset } from "../../../lib/api/assets";
import { OrderSummary, Steps } from "../../../components/order-summary";
import { isSoldOut } from "../../../lib/asset-utils";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "../../../lib/auth";

export default async function CartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(`/cart/${id}`));
  const asset = await getAsset(id);
  if (!asset) notFound();
  const own = asset.creatorId === user.id;

  return (
    <main className="px-app">
      <Steps current={1} />
      <h1 className="px-h px-title">Your cart</h1>
      <section className="px-panel" style={{ maxWidth: 720 }}>
        <OrderSummary asset={asset} />
        {own ? (
          <p className="px-err" style={{ marginTop: "1rem" }}>
            This is your own listing, so you can’t buy it.
          </p>
        ) : isSoldOut(asset) ? (
          <p className="px-err" style={{ marginTop: "1rem" }}>
            This asset has sold out and can no longer be purchased.
          </p>
        ) : (
          <div className="px-actions">
            <Link href={`/checkout/${asset.id}`} className="px-btn">
              Continue to payment
            </Link>
            <Link href={`/assets/${asset.id}`} className="px-btn px-btn-ghost">
              Remove
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
