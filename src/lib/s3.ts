import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

export const AWS_REGION = process.env.AWS_REGION ?? "ap-south-1";
export const S3_BUCKET = process.env.S3_BUCKET ?? "boost-v2-images";

// CDN base — set this to the CloudFront distribution (or custom CNAME) once
// the bucket is fronted. When unset, all helpers fall back to direct S3
// origin URLs so local dev / pre-CDN setups keep working.
const CDN_BASE =
  process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.replace(/\/$/, "") ?? "";

const S3_ORIGIN_HOST = `${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
const S3_ORIGIN = `https://${S3_ORIGIN_HOST}`;

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

/**
 * Public URL for `key`. Prefers the CDN base when configured (production),
 * falls back to the S3 origin (dev / pre-CDN). New uploads come through
 * here so they land in the DB already pointing at the CDN.
 */
export function publicUrlFor(key: string) {
  const path = key
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${CDN_BASE || S3_ORIGIN}/${path}`;
}

/**
 * Rewrite a stored URL to use the CDN host when configured. Existing rows
 * in `accounts.images` and `profiles.avatar_url` may still carry direct
 * S3-origin URLs from before the CDN was wired; this swaps the host so
 * callers always emit CDN URLs without needing a one-shot DB migration.
 *
 * Returns the input unchanged if:
 *   - CDN is not configured, OR
 *   - the URL already points at the CDN, OR
 *   - the URL points somewhere we don't own (OAuth avatars, external CDNs).
 */
export function cdnUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!CDN_BASE) return url;
  if (url.startsWith(`${CDN_BASE}/`) || url === CDN_BASE) return url;
  if (url.startsWith(`${S3_ORIGIN}/`)) {
    return CDN_BASE + url.slice(S3_ORIGIN.length);
  }
  return url;
}

/** Recovers the object key from a public URL (either CDN or bucket-direct). */
export function keyFromUrl(url: string): string | null {
  const candidates = [CDN_BASE, S3_ORIGIN].filter(
    (v): v is string => Boolean(v),
  );
  for (const base of candidates) {
    if (url.startsWith(`${base}/`)) {
      return decodeURIComponent(url.slice(base.length + 1));
    }
  }
  return null;
}

/** Best-effort deletion of multiple S3 objects by public URL. Silent on failure. */
export async function deleteObjectsByUrl(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  const keys = urls.map(keyFromUrl).filter((k): k is string => Boolean(k));
  if (keys.length === 0) return;
  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: S3_BUCKET,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    }),
  );
}
