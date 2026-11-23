import Link from "next/link";
import { notFound } from "next/navigation";
import "../../pixel.css";
import { getAsset, listAssets } from "../../../lib/api/assets";
import { RarityBadge, StockBlocks } from "../../../components/asset-card";
import {
  CATEGORY_LABELS,
  formatPrice,
  isSoldOut,
} from "../../../lib/asset-utils";
import { getCurrentUser, loginUrl } from "../../../lib/auth";

export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const asset = await getAsset((await params).id);
  if (!asset) notFound();
  const soldOut = isSoldOut(asset);
  const user = await getCurrentUser();
  const own = user?.id === asset.creatorId;
  const more = (await listAssets())
    .filter((a) => a.creatorId === asset.creatorId && a.id !== asset.id)
    .slice(0, 6);

  return (
    <main className="px-app">
      <Link href="/" className="px-muted">
        Back to shop
      </Link>
      <div className="px-detail">
        <div>
          <div className="px-stage">
            {asset.previewImages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`${asset.title} preview ${i + 1}`}
                className="px-preview"
              />
            ))}
          </div>
          <h1 className="px-h px-title">{asset.title}</h1>
          <div className="px-creator">
            <span className="px-avatar" aria-hidden="true">
              {asset.creatorName[0]}
            </span>
            <div>
              <Link href={`/creators/${asset.creatorId}`}>
                <strong>{asset.creatorName}</strong>
              </Link>
              <p className="px-muted">{CATEGORY_LABELS[asset.category]}</p>
            </div>
          </div>
          <p>{asset.description}</p>
          <dl className="px-meta">
            {asset.fileFormats && (
              <>
                <dt>Formats</dt>
                <dd>{asset.fileFormats.join(", ")}</dd>
              </>
            )}
            {asset.compatibleWith && (
              <>
                <dt>Works with</dt>
                <dd>{asset.compatibleWith.join(", ")}</dd>
              </>
            )}
            <dt>License</dt>
            <dd>
              Standard license: use in your own projects. The creator keeps the
              copyright.
            </dd>
          </dl>
        </div>
        <aside>
          <div className="px-buybox">
            <RarityBadge asset={asset} />
            <p className="px-price px-big">
              {formatPrice(asset.price, asset.currency)}
            </p>
            <StockBlocks asset={asset} />
            {own ? (
              <Link
                href={`/sell/${asset.id}/edit`}
                className="px-btn px-btn-ghost"
              >
                Edit your listing
              </Link>
            ) : soldOut ? (
              <button className="px-btn" disabled>
                Sold out
              </button>
            ) : (
              <Link
                href={
                  user ? `/cart/${asset.id}` : loginUrl(`/cart/${asset.id}`)
                }
                className="px-btn"
              >
                {user ? "Add to cart" : "Sign in to buy"}
              </Link>
            )}
          </div>
          {more.length > 0 && (
            <section>
              <h2 className="px-side-h">More by {asset.creatorName}</h2>
              <div className="px-thumbs">
                {more.map((m) => (
                  <Link
                    key={m.id}
                    href={`/assets/${m.id}`}
                    aria-label={m.title}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.previewImages[0]}
                      alt=""
                      className="px-preview"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
