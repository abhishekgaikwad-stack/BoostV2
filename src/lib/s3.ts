import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

export const AWS_REGION = process.env.AWS_REGION ?? "ap-south-1";
export const S3_BUCKET = process.env.S3_BUCKET ?? "boost-v2-images";

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export function publicUrlFor(key: string) {
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/** Recovers the object key from a public URL (either CDN or bucket-direct). */
export function keyFromUrl(url: string): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.replace(/\/$/, ""),
    `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`,
  ].filter((v): v is string => Boolean(v));

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
