import type { Asset } from "../types/asset";
import { CATEGORY_LABELS, formatPrice } from "../lib/asset-utils";
import { RarityBadge } from "./asset-card";

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Cart", "Payment", "Done"];
  return (
    <ol className="px-steps" aria-label="Checkout progress">
      {steps.map((s, i) => (
        <li
          key={s}
          className={i + 1 === current ? "px-on" : ""}
          aria-current={i + 1 === current ? "step" : undefined}
        >
          {i + 1}. {s}
        </li>
      ))}
    </ol>
  );
}

export function OrderSummary({ asset }: { asset: Asset }) {
  const price = formatPrice(asset.price, asset.currency);
  return (
    <div>
      <div className="px-summary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.previewImages[0]} alt="" />
        <div>
          <RarityBadge asset={asset} />
          <h2 className="px-h">{asset.title}</h2>
          <p className="px-muted">
            by {asset.creatorName} in {CATEGORY_LABELS[asset.category]}
          </p>
          <p className="px-muted">
            Standard license. The creator keeps the copyright.
          </p>
        </div>
        <p className="px-price">{price}</p>
      </div>
      <dl className="px-totals">
        <dt>Subtotal (1 item)</dt>
        <dd>{price}</dd>
        <dt className="px-grand">Total</dt>
        <dd className="px-grand">{price}</dd>
      </dl>
    </div>
  );
}
