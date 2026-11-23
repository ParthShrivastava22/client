// app/sell/listings/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "../../../lib/auth";
import { ensureCreator, listOwnAssets } from "../../../lib/api/assets";
import {
  deleteListingAction,
  saveProfileAction,
  setStatusAction,
} from "../actions";
import { RarityBadge } from "../../../components/asset-card";
import { DeleteButton } from "../../../components/delete-button";
import { formatPrice } from "../../../lib/asset-utils";
import type { AssetStatus } from "../../../types/asset";

const STATUS: Record<AssetStatus, string> = {
  draft: "Draft",
  published: "Live",
  archived: "Unpublished",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("/sell/listings"));
  const sp = await searchParams;
  const creator = await ensureCreator(user);
  const assets = await listOwnAssets(user.id);

  return (
    <main className="px-app">
      <div className="px-pagehead">
        <h1 className="px-title">My listings</h1>
        <Link href="/sell" className="px-btn">
          New listing
        </Link>
      </div>
      {sp.saved && (
        <p className="px-ok" role="status">
          Listing saved.
        </p>
      )}

      <section
        className="px-panel"
        style={{ marginBottom: "1.5rem", maxWidth: 680 }}
      >
        <h2 className="px-side-h" style={{ marginTop: 0 }}>
          Creator profile
        </h2>
        <form action={saveProfileAction} className="px-form">
          <div className="px-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={creator.displayName}
              minLength={2}
              maxLength={40}
              required
            />
          </div>
          <div className="px-field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={280}
              defaultValue={creator.bio}
            />
          </div>
          <div className="px-actions" style={{ marginTop: 0 }}>
            <button className="px-btn px-btn-sm" type="submit">
              Save profile
            </button>
            <Link
              href={`/creators/${creator.id}`}
              className="px-btn px-btn-sm px-btn-ghost"
            >
              View public profile
            </Link>
          </div>
        </form>
      </section>

      {assets.length === 0 ? (
        <p className="px-muted">You haven’t created any listings yet.</p>
      ) : (
        <div className="px-orders">
          {assets.map((a) => (
            <article key={a.id} className="px-listing">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.previewImages[0]} alt="" />
              <div>
                <strong>{a.title}</strong>
                <p className="px-muted">
                  {formatPrice(a.price, a.currency)} ·{" "}
                  {a.editionLimit === null
                    ? `${a.soldCount} sold`
                    : `${a.soldCount} of ${a.editionLimit} sold`}
                </p>
                <span className="px-status">{STATUS[a.status]}</span>{" "}
                <RarityBadge asset={a} />
                {a.soldCount > 0 && (
                  <p className="px-muted">
                    Has buyers: unpublish instead of deleting.
                  </p>
                )}
              </div>
              <div className="px-listing-actions">
                <Link
                  href={`/sell/${a.id}/edit`}
                  className="px-btn px-btn-sm px-btn-ghost"
                >
                  Edit
                </Link>
                <form action={setStatusAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={a.status === "published" ? "archived" : "published"}
                  />
                  <button className="px-btn px-btn-sm" type="submit">
                    {a.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                </form>
                {a.soldCount === 0 && (
                  <form action={deleteListingAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <DeleteButton title={a.title} />
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
