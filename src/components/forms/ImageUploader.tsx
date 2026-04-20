"use client";

import { ImagePlus, RotateCcw, Star, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useImageUploader } from "@/hooks/use-image-uploader";
import { cn } from "@/lib/utils";

type Props = {
  name: string; // form field name: formData.getAll(name) returns URLs
  endpoint?: string;
  maxFiles?: number;
  maxSize?: number; // bytes
  acceptedTypes?: string[];
  className?: string;
};

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function ImageUploader({
  name,
  endpoint = "/api/uploads/listing-image",
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPT,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const [isDragging, setDragging] = useState(false);
  const uploader = useImageUploader({
    endpoint,
    maxFiles,
    maxSize,
    acceptedTypes,
  });

  function openPicker() {
    inputRef.current?.click();
  }

  const sizeLimitMb = Math.round(maxSize / 1024 / 1024);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Hidden inputs — feed uploaded URLs into the enclosing <form> */}
      {uploader.urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length) uploader.addFiles(files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={openPicker}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length) {
            uploader.addFiles(event.dataTransfer.files);
          }
        }}
        disabled={!uploader.canAcceptMore}
        aria-label="Upload images"
        className={cn(
          "flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-5 text-center transition",
          isDragging
            ? "border-brand-accent bg-brand-accent/10"
            : "border-brand-border-light bg-brand-bg-light hover:border-brand-text-secondary-light",
          !uploader.canAcceptMore && "opacity-60 cursor-not-allowed",
        )}
      >
        <ImagePlus
          className="h-6 w-6 text-brand-text-secondary-light"
          strokeWidth={1.5}
        />
        <span className="font-display text-[14px] font-medium text-brand-text-primary-light">
          Drop images here, or click to browse
        </span>
        <span className="font-display text-[12px] text-brand-text-secondary-light">
          JPEG, PNG, WebP · up to {sizeLimitMb} MB each · max {maxFiles} images
        </span>
      </button>

      {uploader.items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {uploader.items.map((item, index) => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-brand-border-light bg-brand-bg-light"
            >
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={item.previewUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {index === 0 && item.status === "done" ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-brand-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-brand-text-primary-light">
                    <Star
                      className="h-3 w-3"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    Cover
                  </span>
                ) : null}

                {item.status === "uploading" ? (
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full bg-black/60 px-2 py-1 text-white backdrop-blur-sm">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-brand-accent transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold">
                      {item.progress}%
                    </span>
                  </div>
                ) : null}

                {item.status === "error" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-discount/80 p-3 text-center text-white">
                    <span className="font-display text-[11px] font-medium leading-4">
                      {item.errorMessage ?? "Upload failed"}
                    </span>
                    <button
                      type="button"
                      onClick={() => uploader.retry(item.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 font-display text-[11px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
                    >
                      <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate font-display text-[11px] font-medium text-brand-text-secondary-light">
                  {item.file.name}
                </span>
                <div className="flex items-center gap-1">
                  {index > 0 && item.status === "done" ? (
                    <button
                      type="button"
                      onClick={() => uploader.moveToFront(item.id)}
                      aria-label="Set as cover"
                      className="grid h-6 w-6 place-items-center rounded-md text-brand-text-secondary-light transition hover:bg-brand-bg-pill hover:text-brand-text-primary-light"
                    >
                      <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => uploader.remove(item.id)}
                    aria-label="Remove image"
                    className="grid h-6 w-6 place-items-center rounded-md text-brand-text-secondary-light transition hover:bg-brand-bg-pill hover:text-brand-discount"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {uploader.isUploading ? (
        <p
          aria-live="polite"
          className="font-display text-[11px] font-medium text-brand-text-secondary-light"
        >
          Uploading…
        </p>
      ) : null}
    </div>
  );
}
