import Link from "next/link";
import { notFound } from "next/navigation";
import { getAsset } from "../../../lib/api/assets";
import { OrderSummary, Steps } from "../../../components/order-summary";
import { PaymentForm } from "../../../components/payment-form";
import { formatPrice, isSoldOut } from "../../../lib/asset-utils";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const asset = await getAsset((await params).id);
  if (!asset) notFound();

  return (
    <main className="px-app">
      <Steps current={2} />
      <h1 className="px-h px-title">Payment</h1>
      {isSoldOut(asset) ? (
        <p>
          This asset has sold out.{" "}
          <Link href="/" className="px-muted">
            Back to the shop
          </Link>
        </p>
      ) : (
        <div className="px-checkout">
          <section className="px-panel">
            <h2 className="px-side-h" style={{ marginTop: 0 }}>
              Order
            </h2>
            <OrderSummary asset={asset} />
          </section>
          <section className="px-panel">
            <p className="px-demo">
              Demo mode: no real payment is taken. Card details stay in your
              browser and are never sent or stored. Try 4242 4242 4242 4242, any
              future date, any 3 digits.
            </p>
            <PaymentForm
              assetId={asset.id}
              total={formatPrice(asset.price, asset.currency)}
            />
          </section>
        </div>
      )}
    </main>
  );
}
