import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "../../lib/auth";
import { findAsset, listOrders } from "../../lib/api/assets";
import { Steps } from "../../components/order-summary";
import { formatPrice } from "../../lib/asset-utils";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("/orders"));
  const sp = await searchParams;
  const orders = await listOrders(user.id);
  const items = await Promise.all(
    orders.map(async (o) => ({ o, asset: await findAsset(o.assetId) })),
  );
  const fresh = orders.find((o) => o.id === sp.new);

  return (
    <main className="px-app">
      {fresh && <Steps current={3} />}
      <h1 className="px-h px-title">My orders</h1>
      {fresh && (
        <p className="px-ok" role="status">
          Payment complete. Order {fresh.id} is in your library.
        </p>
      )}
      {items.length === 0 ? (
        <p className="px-muted">
          No orders yet. <Link href="/">Browse the shop</Link>
        </p>
      ) : (
        <div className="px-orders">
          {items.map(({ o, asset }) => (
            <article key={o.id} className="px-order">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {asset ? <img src={asset.previewImages[0]} alt="" /> : <span />}
              <div>
                <strong>{o.title}</strong>
                <p className="px-muted">
                  {o.id} · {new Date(o.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <span className="px-price">
                {formatPrice(o.price, o.currency)}
              </span>
              <button
                className="px-btn px-btn-sm px-btn-ghost"
                disabled
                title="Not wired up in the demo"
              >
                Download (demo)
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
