"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteListing } from "@/app/(dashboard)/user/currently-selling/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function ListingActions({
  offerId,
  title,
}: {
  offerId: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function closeDialog() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteListing(offerId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/user/currently-selling/${offerId}`}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-black px-4 font-display text-[13px] font-medium text-white transition hover:bg-brand-bg-surface"
      >
        <Pencil className="h-4 w-4" strokeWidth={1.5} />
        Edit
      </Link>
      <button
        type="button"
        aria-label={`Delete listing: ${title}`}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-border-light bg-white text-brand-text-secondary-light transition hover:border-brand-discount hover:text-brand-discount"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={closeDialog}
        title="Delete listing?"
        description="Once deleted listing details will not be recovered."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        pending={pending}
        error={error}
        onConfirm={handleDelete}
      />
    </div>
  );
}
