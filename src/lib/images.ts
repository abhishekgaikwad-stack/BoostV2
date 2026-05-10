// Normalize the env value: strips trailing slash, and prepends `https://`
// if the user pasted a bare hostname or a protocol-relative `//host` form.
// Vercel's image optimizer 400s on protocol-relative URLs.
const BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!raw) return "https://boost-v2-images.s3.ap-south-1.amazonaws.com";
  const trimmed = raw.replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/*/, "")}`;
})();

export function gameImage(slug: string, ext: "webp" | "png" | "jpg" = "webp") {
  return `${BASE}/games/${slug}.${ext}`;
}

export function assetUrl(key: string) {
  return `${BASE}/${key.replace(/^\//, "")}`;
}

export function paymentIcon(slug: string, ext: "svg" | "png" | "webp" = "svg") {
  return `${BASE}/payment-icons/${slug}.${ext}`;
}
