import { isArtKind, renderArt } from "../../../../lib/art/generate";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; seed: string }> },
) {
  const { kind, seed } = await params;
  const n = Number(seed);
  if (!isArtKind(kind) || !Number.isInteger(n) || n < 0 || n > 100000) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(renderArt(kind, n), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
