export const CATEGORIES = [
  "sprite-pack",
  "tileset",
  "sprite-sheet",
  "ui-kit",
  "icon-pack",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type AssetStatus = "draft" | "published" | "archived";

// Public listing contract. Downloadable files are deliberately NOT here:
// they belong to the entitlement/library flow, never the public payload.
export interface Asset {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  category: Category;
  price: number; // integer minor units (1999 = 19.99)
  currency: "USD";
  editionLimit: number | null; // null = unlimited, 1 = exclusive
  soldCount: number;
  status: AssetStatus;
  previewImages: string[];
  previewAspect?: number; // width / height of the first preview, so the gallery can lay out rows
  tags?: string[];
  fileFormats?: string[];
  compatibleWith?: string[];
  createdAt: string;
  updatedAt: string;
}
