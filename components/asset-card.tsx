import Link from "next/link";
import type { Asset } from "../types/asset";
import {
  CATEGORY_LABELS,
  RARITY_LABELS,
  formatPrice,
  isSoldOut,
  rarityOf,
  remaining,
} from "../lib/asset-utils";

export function RarityBadge({ asset }: { asset: Asset }) {
  const r = rarityOf(asset);
  return (
    <span className={`px-badge px-${r}`}>
      {isSoldOut(asset) ? "Sold out" : RARITY_LABELS[r]}
    </span>
  );
}

// Segmented stock bar: one segment per copy up to 10, otherwise 10 segments scaled.
export function StockBlocks({ asset }: { asset: Asset }) {
  const left = remaining(asset);
  const limit = asset.editionLimit;
  if (left === null || limit === null)
    return <p className="px-muted">Unlimited copies</p>;
  const total = Math.min(limit, 10);
  const filled =
    limit <= 10
      ? left
      : left === 0
        ? 0
        : Math.max(1, Math.round((left / limit) * total));
  return (
    <div>
      <div
        className="px-blocks"
        role="img"
        aria-label={`${left} of ${limit} left`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < filled ? "px-on" : ""} />
        ))}
      </div>
      <p className="px-muted">
        {left} of {limit} left
      </p>
    </div>
  );
}

export function AssetCard({ asset }: { asset: Asset }) {
  const left = remaining(asset);
  const kind = CATEGORY_LABELS[asset.category].replace(/s$/, "");
  return (
    <Link
      href={`/assets/${asset.id}`}
      aria-label={`${asset.title} by ${asset.creatorName}, ${formatPrice(asset.price, asset.currency)}`}
      className={`px-card ${isSoldOut(asset) ? "px-soldout" : ""}`}
    >
      <div className="px-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.previewImages[0]} alt="" loading="lazy" />
        <RarityBadge asset={asset} />
      </div>
      <span className="px-kind">{kind}</span>
      <strong className="px-card-title">{asset.title}</strong>
      <span className="px-cardfoot">
        <span className="px-price">
          {formatPrice(asset.price, asset.currency)}
        </span>
        {left !== null && left > 0 && (
          <span className="px-left">{left} left</span>
        )}
      </span>
    </Link>
  );
}
