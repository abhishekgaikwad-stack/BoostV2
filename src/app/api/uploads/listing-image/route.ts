import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { S3_BUCKET, publicUrlFor, s3Client } from "@/lib/s3";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function extFor(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "bin";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Only sellers can request upload slots for listing images.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_seller) {
    return NextResponse.json(
      { error: "Seller mode required to upload listing images." },
      { status: 403 },
    );
  }

  let body: { contentType?: string; size?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contentType, size } = body;
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "File must be JPEG, PNG or WebP." },
      { status: 400 },
    );
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 10 MB." },
      { status: 400 },
    );
  }

  const random = Math.random().toString(36).slice(2, 10);
  const key = `listings/${user.id}/${Date.now()}-${random}.${extFor(contentType)}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  return NextResponse.json({
    uploadUrl,
    publicUrl: publicUrlFor(key),
    key,
  });
}
