"use client";

import { useActionState } from "react";
import {
  type UpdateListingState,
  updateListing,
} from "@/app/(dashboard)/user/currently-selling/[offerId]/actions";
import { CredentialsFieldset } from "@/components/forms/CredentialsFieldset";
import type { AccountCredentials } from "@/lib/credentials";

const initialState: UpdateListingState = {};

export type EditableListing = {
  id: string;
  title: string;
  description: string | null;
  price: number; // cents
  oldPrice: number | null; // cents
  game: { slug: string; name: string };
};

export function EditListingForm({
  listing,
  credentials,
}: {
  listing: EditableListing;
  credentials: AccountCredentials | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateListing.bind(null, listing.id),
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-[32px] border border-brand-border-light bg-white p-6"
    >
      <div className="flex flex-col gap-2">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
          Game
        </span>
        <p className="font-display text-[14px] font-medium text-brand-text-primary-light">
          {listing.game.name}
          <span className="ml-2 font-mono text-[11px] text-brand-text-secondary-light">
            /games/{listing.game.slug}
          </span>
        </p>
      </div>

      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={listing.title}
          className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={6}
          defaultValue={listing.description ?? ""}
          className="w-full resize-y rounded-xl bg-brand-bg-pill p-4 font-display text-[13px] font-medium leading-5 text-brand-text-primary-light focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Selling price (€)">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={(listing.price / 100).toFixed(2)}
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
          />
        </Field>
        <Field label="MRP / old price (€)">
          <input
            name="oldPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={
              listing.oldPrice != null ? (listing.oldPrice / 100).toFixed(2) : ""
            }
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
          />
        </Field>
      </div>

      <CredentialsFieldset initial={credentials} />

      {state.error ? (
        <p className="font-display text-[12px] font-medium text-brand-discount">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="font-display text-[12px] font-medium text-brand-success">
          Saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[14px] font-medium text-brand-text-primary-light transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
        {label}
      </span>
      {children}
    </label>
  );
}
