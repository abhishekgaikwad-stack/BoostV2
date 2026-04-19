"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Status = "idle" | "uploading" | "success" | "error";

export function ProfilePictureRow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setErrorMsg(null);

    try {
      const presignRes = await fetch("/api/uploads/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const { error } = await presignRes.json().catch(() => ({}));
        throw new Error(error ?? "Could not request upload URL");
      }
      const { uploadUrl, publicUrl } = (await presignRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`S3 upload failed (${putRes.status})`);
      }

      const saveRes = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      if (!saveRes.ok) {
        const { error } = await saveRes.json().catch(() => ({}));
        throw new Error(error ?? "Could not save avatar URL");
      }

      setStatus("success");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="flex items-start gap-6">
      <span className="w-[160px] shrink-0 pt-3 font-display text-[16px] font-medium leading-5 text-brand-text-primary-light">
        Profile picture
      </span>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className="inline-flex h-14 w-fit items-center justify-center rounded-xl bg-black px-6 font-display text-[14px] font-medium leading-6 text-white transition hover:bg-brand-bg-surface disabled:opacity-60"
        >
          {status === "uploading" ? "Uploading…" : "Upload image"}
        </button>
        <span className="font-display text-[12px] font-normal leading-4 text-brand-text-secondary-dark">
          Must be JPEG, PNG, HEIC or WebP and cannot exceed 10MB.
        </span>
        {status === "success" ? (
          <span className="font-display text-[12px] font-normal leading-4 text-brand-success">
            Uploaded — avatar updated.
          </span>
        ) : null}
        {status === "error" && errorMsg ? (
          <span className="font-display text-[12px] font-normal leading-4 text-brand-discount">
            {errorMsg}
          </span>
        ) : null}
      </div>
    </div>
  );
}
