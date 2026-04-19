import { S3Client } from "@aws-sdk/client-s3";

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
