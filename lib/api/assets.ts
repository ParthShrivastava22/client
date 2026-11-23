// The ONLY place that knows where data comes from. Later: swap bodies for axios calls.
import type { Asset, AssetStatus, Category } from "../../types/asset";
import { db, type Creator, type Order } from "../mock/db";
import { isSoldOut } from "../asset-utils";
import type { CurrentUser } from "../current-user";

export interface AssetFilters {
  category?: Category;
  q?: string;
}
export interface NewAsset {
  title: string;
  description: string;
  category: Category;
  price: number;
  editionLimit: number | null;
  previewImages: string[];
  tags: string[];
  fileFormats: string[];
  compatibleWith: string[];
  status: AssetStatus;
}

const withSales = (a: Asset): Asset => ({
  ...a,
  soldCount: a.soldCount + (db.sold[a.id] ?? 0),
});
const newest = (x: Asset, y: Asset) => y.createdAt.localeCompare(x.createdAt);

/* ---------- public catalogue ---------- */
export async function listAssets(f: AssetFilters = {}): Promise<Asset[]> {
  const q = f.q?.trim().toLowerCase();
  return db.assets
    .filter((a) => a.status === "published")
    .map(withSales)
    .filter((a) => !f.category || a.category === f.category)
    .filter(
      (a) =>
        !q || [a.title, ...(a.tags ?? [])].join(" ").toLowerCase().includes(q),
    )
    .sort(newest);
}
export async function getAsset(id: string): Promise<Asset | null> {
  const a = db.assets.find((x) => x.id === id && x.status === "published");
  return a ? withSales(a) : null;
}
// Any status: used for a buyer's order history, so withdrawn assets still show.
export async function findAsset(id: string): Promise<Asset | null> {
  const a = db.assets.find((x) => x.id === id);
  return a ? withSales(a) : null;
}

/* ---------- creators ---------- */
export async function getCreator(id: string): Promise<Creator | null> {
  return db.creators[id] ?? null;
}
export async function ensureCreator(user: CurrentUser): Promise<Creator> {
  return (db.creators[user.id] ??= {
    id: user.id,
    displayName: user.email.split("@")[0].slice(0, 40),
    bio: "",
    joinedAt: new Date().toISOString(),
  });
}
export async function updateCreator(
  user: CurrentUser,
  patch: { displayName: string; bio: string },
) {
  const c = await ensureCreator(user);
  c.displayName = patch.displayName;
  c.bio = patch.bio;
  db.assets.forEach((a) => {
    if (a.creatorId === user.id) a.creatorName = c.displayName;
  }); // denormalised copy
}
export async function listCreatorAssets(creatorId: string): Promise<Asset[]> {
  return db.assets
    .filter((a) => a.creatorId === creatorId && a.status === "published")
    .map(withSales)
    .sort(newest);
}
export async function listOwnAssets(userId: string): Promise<Asset[]> {
  return db.assets
    .filter((a) => a.creatorId === userId)
    .map(withSales)
    .sort(newest);
}
export async function getOwnAsset(
  userId: string,
  id: string,
): Promise<Asset | null> {
  const a = db.assets.find((x) => x.id === id && x.creatorId === userId);
  return a ? withSales(a) : null;
}

/* ---------- ownership-checked writes ---------- */
export async function createAsset(
  user: CurrentUser,
  input: NewAsset,
): Promise<Asset> {
  const creator = await ensureCreator(user);
  const now = new Date().toISOString();
  const asset: Asset = {
    ...input,
    id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    creatorId: user.id,
    creatorName: creator.displayName,
    currency: "USD",
    soldCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.assets.push(asset);
  return asset;
}

type Patch = Partial<
  Pick<
    Asset,
    | "title"
    | "description"
    | "category"
    | "price"
    | "editionLimit"
    | "previewImages"
    | "tags"
    | "fileFormats"
    | "compatibleWith"
  >
>;
export async function updateAsset(
  user: CurrentUser,
  id: string,
  patch: Patch,
): Promise<boolean> {
  const a = db.assets.find((x) => x.id === id && x.creatorId === user.id);
  if (!a) return false;
  Object.assign(a, patch, { updatedAt: new Date().toISOString() }); // past orders keep their own price snapshot
  return true;
}
export async function setAssetStatus(
  user: CurrentUser,
  id: string,
  status: AssetStatus,
): Promise<boolean> {
  const a = db.assets.find((x) => x.id === id && x.creatorId === user.id);
  if (!a) return false;
  a.status = status;
  a.updatedAt = new Date().toISOString();
  return true;
}
export async function deleteAsset(
  user: CurrentUser,
  id: string,
): Promise<"ok" | "forbidden" | "has-sales"> {
  const i = db.assets.findIndex((x) => x.id === id && x.creatorId === user.id);
  if (i < 0) return "forbidden";
  if (withSales(db.assets[i]).soldCount > 0) return "has-sales"; // buyers keep access: unpublish instead
  db.assets.splice(i, 1);
  return "ok";
}

/* ---------- orders ---------- */
export async function placeOrder(
  user: CurrentUser,
  assetId: string,
): Promise<Order> {
  const asset = await getAsset(assetId);
  if (!asset) throw new Error("This asset is no longer available.");
  if (asset.creatorId === user.id)
    throw new Error("You can’t buy your own listing.");
  if (isSoldOut(asset)) throw new Error("Sorry, this asset just sold out.");
  const order: Order = {
    id: `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    userId: user.id,
    assetId,
    title: asset.title,
    price: asset.price, // from the server's copy, never from the browser
    currency: asset.currency,
    createdAt: new Date().toISOString(),
    status: "paid",
  };
  db.orders.unshift(order);
  db.sold[assetId] = (db.sold[assetId] ?? 0) + 1;
  return order;
}
export async function listOrders(userId: string): Promise<Order[]> {
  return db.orders.filter((o) => o.userId === userId);
}
