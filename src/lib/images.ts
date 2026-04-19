const BASE =
  process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.replace(/\/$/, "") ??
  "https://boost-v2-images.s3.ap-south-1.amazonaws.com";

export function gameImage(slug: string, ext: "webp" | "png" | "jpg" = "webp") {
  return `${BASE}/games/${slug}.${ext}`;
}

export function assetUrl(key: string) {
  return `${BASE}/${key.replace(/^\//, "")}`;
}
