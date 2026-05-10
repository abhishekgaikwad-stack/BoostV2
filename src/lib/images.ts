// Normalize the env value: strips trailing slash, and prepends `https://`
// if the user pasted a bare hostname or a protocol-relative `//host` form.
// Vercel's image optimizer 400s on protocol-relative URLs.
//
// Fallback is the production CloudFront distribution — direct S3 origin
// is blocked at the bucket policy level, and only *.cloudfront.net is
// allowed in next.config.ts remotePatterns.
const BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!raw) return "https://d26cw56evdaasy.cloudfront.net";
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
