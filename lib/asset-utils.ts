import type { Asset, Category } from "../types/asset";

export type Rarity = "common" | "rare" | "legendary";

export const CATEGORY_LABELS: Record<Category, string> = {
  "sprite-pack": "Sprite packs",
  tileset: "Tilesets",
  "sprite-sheet": "Sprite sheets",
  "ui-kit": "UI kits",
  "icon-pack": "Icon packs",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Unlimited",
  rare: "Limited",
  legendary: "Exclusive",
};

export const remaining = (a: Asset) =>
  a.editionLimit === null ? null : Math.max(a.editionLimit - a.soldCount, 0);
export const isSoldOut = (a: Asset) => remaining(a) === 0;
export const rarityOf = (a: Asset): Rarity =>
  a.editionLimit === null ? "common" : a.editionLimit === 1 ? "legendary" : "rare";
export const formatPrice = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
