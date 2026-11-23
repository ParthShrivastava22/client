import { notFound } from "next/navigation";
import { getCreator, listCreatorAssets } from "../../../lib/api/assets";
import { AssetCard } from "../../../components/asset-card";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const creator = await getCreator(id);
  if (!creator) notFound();
  const assets = await listCreatorAssets(id);
  const sales = assets.reduce((n, a) => n + a.soldCount, 0);
  const joined = new Date(creator.joinedAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="px-app">
      <header className="px-profile">
        <span className="px-avatar px-avatar-lg" aria-hidden="true">
          {creator.displayName[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="px-title" style={{ margin: 0 }}>
            {creator.displayName}
          </h1>
          <p className="px-muted">
            {assets.length} {assets.length === 1 ? "asset" : "assets"} · {sales}{" "}
            sales · Joined {joined}
          </p>
          {creator.bio && <p style={{ maxWidth: "60ch" }}>{creator.bio}</p>}
        </div>
      </header>
      {assets.length === 0 ? (
        <p className="px-muted">No published assets yet.</p>
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
