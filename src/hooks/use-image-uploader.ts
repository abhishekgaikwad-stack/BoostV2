"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "uploading" | "done" | "error";
  progress: number; // 0..100
  publicUrl?: string;
  errorMessage?: string;
};

type Options = {
  endpoint: string;
  maxFiles: number;
  maxSize: number; // bytes
  acceptedTypes: string[];
};

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
};

export type ImageUploader = {
  items: UploadItem[];
  addFiles: (files: FileList | File[]) => void;
  remove: (id: string) => void;
  retry: (id: string) => void;
  moveToFront: (id: string) => void;
  urls: string[];
  isUploading: boolean;
  canAcceptMore: boolean;
};

/**
 * Drives a list of direct-to-S3 uploads. Each file goes through:
 *   queued -> uploading (with progress) -> done  (or error)
 * A component renders the UI; this hook owns state and lifecycle.
 * Preview blob URLs are revoked on remove / unmount so they don't leak.
 */
export function useImageUploader(options: Options): ImageUploader {
  const { endpoint, maxFiles, maxSize, acceptedTypes } = options;
  const [items, setItems] = useState<UploadItem[]>([]);
  // Track active XHRs so we can abort on unmount or remove.
  const xhrs = useRef(new Map<string, XMLHttpRequest>());

  const canAcceptMore = items.length < maxFiles;

  const urls = useMemo(
    () =>
      items
        .filter((i) => i.status === "done" && i.publicUrl)
        .map((i) => i.publicUrl as string),
    [items],
  );

  const isUploading = useMemo(
    () => items.some((i) => i.status === "uploading" || i.status === "queued"),
    [items],
  );

  const abort = useCallback((id: string) => {
    const xhr = xhrs.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrs.current.delete(id);
    }
  }, []);

  const revoke = useCallback((url: string) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* blob URL already revoked — ignore */
    }
  }, []);

  const upload = useCallback(
    (item: UploadItem) => {
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: "uploading", progress: 0, errorMessage: undefined }
            : p,
        ),
      );

      (async () => {
        try {
          const presignRes = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              contentType: item.file.type,
              size: item.file.size,
            }),
          });
          if (!presignRes.ok) {
            const { error } = await presignRes
              .json()
              .catch(() => ({ error: undefined }));
            throw new Error(error ?? "Could not request upload URL.");
          }
          const { uploadUrl, publicUrl } =
            (await presignRes.json()) as PresignResponse;

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrs.current.set(item.id, xhr);
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("content-type", item.file.type);
            xhr.upload.onprogress = (event) => {
              if (!event.lengthComputable) return;
              const pct = Math.round((event.loaded / event.total) * 100);
              setItems((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, progress: pct } : p,
                ),
              );
            };
            xhr.onload = () => {
              xhrs.current.delete(item.id);
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`S3 upload failed (${xhr.status})`));
            };
            xhr.onerror = () => {
              xhrs.current.delete(item.id);
              reject(new Error("Network error during upload."));
            };
            xhr.onabort = () => {
              xhrs.current.delete(item.id);
              reject(new Error("Upload cancelled."));
            };
            xhr.send(item.file);
          });

          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "done", progress: 100, publicUrl }
                : p,
            ),
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    status: "error",
                    errorMessage:
                      err instanceof Error ? err.message : "Upload failed.",
                  }
                : p,
            ),
          );
        }
      })();
    },
    [endpoint],
  );

  const addFiles = useCallback(
    (input: FileList | File[]) => {
      const files = Array.from(input);
      setItems((prev) => {
        const slotsLeft = maxFiles - prev.length;
        const accepted: UploadItem[] = [];
        for (const file of files.slice(0, slotsLeft)) {
          if (!acceptedTypes.includes(file.type)) continue;
          if (file.size > maxSize) continue;
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          accepted.push({
            id,
            file,
            previewUrl: URL.createObjectURL(file),
            status: "queued",
            progress: 0,
          });
        }
        // Kick off uploads asynchronously so state update lands first.
        queueMicrotask(() => accepted.forEach(upload));
        return [...prev, ...accepted];
      });
    },
    [acceptedTypes, maxFiles, maxSize, upload],
  );

  const remove = useCallback(
    (id: string) => {
      abort(id);
      setItems((prev) => {
        const removed = prev.find((p) => p.id === id);
        if (removed) revoke(removed.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    },
    [abort, revoke],
  );

  const retry = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((p) => p.id === id);
        if (item) upload(item);
        return prev;
      });
    },
    [upload],
  );

  const moveToFront = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((p) => p.id !== id)];
    });
  }, []);

  // Clean up any unrevoked blob URLs + in-flight XHRs on unmount.
  useEffect(() => {
    const xhrSnapshot = xhrs.current;
    return () => {
      xhrSnapshot.forEach((xhr) => xhr.abort());
      xhrSnapshot.clear();
      setItems((prev) => {
        prev.forEach((p) => revoke(p.previewUrl));
        return prev;
      });
    };
  }, [revoke]);

  return {
    items,
    addFiles,
    remove,
    retry,
    moveToFront,
    urls,
    isUploading,
    canAcceptMore,
  };
}
