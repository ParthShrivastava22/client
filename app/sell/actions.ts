"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, loginUrl } from "../../lib/auth";
import {
  createAsset,
  deleteAsset,
  getOwnAsset,
  setAssetStatus,
  updateAsset,
  updateCreator,
} from "../../lib/api/assets";
import { CATEGORIES, type Category } from "../../types/asset";
import { renderArt, type ArtKind } from "../../lib/art/generate";

export type FormState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

const ART: Record<Category, ArtKind> = {
  tileset: "tileset",
  "sprite-pack": "sprites",
  "sprite-sheet": "sprites",
  "ui-kit": "ui",
  "icon-pack": "icons",
};
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 250 * 1024; // Next’s default action body limit is 1 MB
const FIELDS = [
  "title",
  "description",
  "category",
  "price",
  "availability",
  "limit",
  "tags",
  "formats",
  "tools",
];

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const list = (s: string, max: number, len: number) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max)
    .map((x) => x.slice(0, len));

// Identify the real file type from its first bytes, not its name or declared type.
function sniff(b: Buffer): string | null {
  if (
    b.length > 12 &&
    b
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  const head = b.subarray(0, 6).toString("latin1");
  if (head === "GIF87a" || head === "GIF89a") return "image/gif";
  if (
    b.length > 12 &&
    b.subarray(0, 4).toString("latin1") === "RIFF" &&
    b.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "image/webp";
  return null;
}

async function parse(fd: FormData, alreadySold: number) {
  const values = Object.fromEntries(FIELDS.map((k) => [k, str(fd, k)]));
  const errors: Record<string, string> = {};
  const title = values.title.trim();
  const description = values.description.trim();
  if (title.length < 3 || title.length > 80)
    errors.title = "Title must be 3 to 80 characters.";
  if (description.length < 10 || description.length > 2000)
    errors.description = "Description must be 10 to 2000 characters.";
  const category = CATEGORIES.find((c) => c === values.category);
  if (!category) errors.category = "Choose a category.";

  const dollars = Number(values.price);
  if (!Number.isFinite(dollars) || dollars < 0.99 || dollars > 999.99)
    errors.price = "Price must be between $0.99 and $999.99.";
  const price = Math.round(dollars * 100);

  let editionLimit: number | null = null;
  if (values.availability === "exclusive") editionLimit = 1;
  else if (values.availability === "limited") {
    const n = Number(values.limit);
    if (!Number.isInteger(n) || n < 2 || n > 10000)
      errors.limit = "Enter a whole number from 2 to 10,000.";
    else editionLimit = n;
  } else if (values.availability !== "unlimited")
    errors.availability = "Choose an availability.";
  if (editionLimit !== null && editionLimit < alreadySold) {
    errors[values.availability === "limited" ? "limit" : "availability"] =
      `${alreadySold} copies are already sold, so the limit can’t be lower.`;
  }

  const files = fd
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const images: string[] = [];
  if (files.length > MAX_IMAGES)
    errors.images = `Upload at most ${MAX_IMAGES} images.`;
  else
    for (const f of files) {
      if (f.size > MAX_IMAGE_BYTES) {
        errors.images = `${f.name} is over 250 KB.`;
        break;
      }
      const bytes = Buffer.from(await f.arrayBuffer());
      const type = sniff(bytes);
      if (!type) {
        errors.images = `${f.name} isn’t a PNG, GIF or WebP image.`;
        break;
      }
      images.push(`data:${type};base64,${bytes.toString("base64")}`);
    }

  return {
    values,
    errors,
    images,
    title,
    description,
    category,
    price,
    editionLimit,
    tags: list(values.tags, 8, 24).map((t) => t.toLowerCase()),
    fileFormats: list(values.formats, 8, 12),
    compatibleWith: list(values.tools, 8, 24),
  };
}

export async function createListingAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("/sell"));
  const p = await parse(fd, 0);
  if (Object.keys(p.errors).length || !p.category)
    return { values: p.values, errors: p.errors };

  const previewImages = p.images.length
    ? p.images
    : [
        `data:image/svg+xml;utf8,${encodeURIComponent(renderArt(ART[p.category], Math.floor(Math.random() * 100000)))}`,
      ]; // demo placeholder
  await createAsset(user, {
    title: p.title,
    description: p.description,
    category: p.category,
    price: p.price,
    editionLimit: p.editionLimit,
    previewImages,
    tags: p.tags,
    fileFormats: p.fileFormats,
    compatibleWith: p.compatibleWith,
    status: str(fd, "intent") === "published" ? "published" : "draft",
  });
  revalidatePath("/", "layout");
  redirect("/sell/listings?saved=1");
}

// Bound to the asset id in the edit page. Ownership is re-checked here regardless of what the page showed.
export async function updateListingAction(
  assetId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(`/sell/${assetId}/edit`));
  const existing = await getOwnAsset(user.id, assetId);
  if (!existing) return { errors: { form: "Listing not found." } };

  const p = await parse(fd, existing.soldCount);
  if (Object.keys(p.errors).length || !p.category)
    return { values: p.values, errors: p.errors };
  await updateAsset(user, assetId, {
    title: p.title,
    description: p.description,
    category: p.category,
    price: p.price,
    editionLimit: p.editionLimit,
    previewImages: p.images.length ? p.images : existing.previewImages,
    tags: p.tags,
    fileFormats: p.fileFormats,
    compatibleWith: p.compatibleWith,
  });
  revalidatePath("/", "layout");
  redirect("/sell/listings?saved=1");
}

export async function setStatusAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  const status = str(fd, "status");
  if (!user || (status !== "published" && status !== "archived")) return;
  await setAssetStatus(user, str(fd, "id"), status);
  revalidatePath("/", "layout");
}

export async function deleteListingAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await deleteAsset(user, str(fd, "id")); // refuses non-owners and listings with buyers
  revalidatePath("/", "layout");
}

export async function saveProfileAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const displayName = str(fd, "displayName").trim().slice(0, 40);
  if (displayName.length < 2) return;
  await updateCreator(user, {
    displayName,
    bio: str(fd, "bio").trim().slice(0, 280),
  });
  revalidatePath("/", "layout");
}
