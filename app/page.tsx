import Link from "next/link";
import { listAssets } from "../lib/api/assets";
import { AssetCard, RarityBadge } from "../components/asset-card";
import { CATEGORIES } from "../types/asset";
import {
  CATEGORY_LABELS,
  formatPrice,
  isSoldOut,
  rarityOf,
} from "../lib/asset-utils";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const category = CATEGORIES.find((c) => c === sp.category);
  const assets = await listAssets({ category, q: sp.q });
  const featured =
    !category && !sp.q
      ? (assets.find((a) => rarityOf(a) === "legendary" && !isSoldOut(a)) ??
        assets[0])
      : undefined;

  return (
    <main className="px-app">
      {featured && (
        <section className="px-hero" aria-label="Featured asset">
          <div className="px-hero-copy">
            <RarityBadge asset={featured} />
            <h2>{featured.title}</h2>
            <p>{featured.description}</p>
            <p className="px-price">
              {formatPrice(featured.price, featured.currency)}
            </p>
            <div className="px-hero-actions">
              <Link href={`/cart/${featured.id}`} className="px-btn">
                Buy now
              </Link>
              <Link
                href={`/assets/${featured.id}`}
                className="px-btn px-btn-ghost"
              >
                View details
              </Link>
            </div>
          </div>
          <div className="px-hero-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.previewImages[0]} alt="" />
          </div>
        </section>
      )}

      <h1 className="px-title">
        {sp.q ? `Results for “${sp.q}”` : "Discover"}
      </h1>
      <nav className="px-chips" aria-label="Categories">
        <Link href="/" className={!category ? "px-on" : ""}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/?category=${c}`}
            className={category === c ? "px-on" : ""}
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </nav>

      {assets.length === 0 ? (
        <p className="px-muted">
          No assets match. Clear the search or pick another category.
        </p>
      ) : (
        <div className="px-grid">
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      )}
    </main>
  );
}
