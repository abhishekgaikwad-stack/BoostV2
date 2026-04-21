import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM. 12-byte IV, 16-byte auth tag appended via getAuthTag().
// Payload wire format: `<iv_b64>.<ciphertext_b64>.<tag_b64>`.
// GCM guarantees both confidentiality and integrity — any tampered byte
// causes decrypt to throw.
const ALGO = "aes-256-gcm";

function loadKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32`.",
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex chars).",
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, loadKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${ciphertext.toString("base64")}.${tag.toString(
    "base64",
  )}`;
}

export function decrypt(payload: string): string {
  const [ivB64, ctB64, tagB64] = payload.split(".");
  if (!ivB64 || !ctB64 || !tagB64) {
    throw new Error("Malformed encrypted payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = createDecipheriv(ALGO, loadKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
