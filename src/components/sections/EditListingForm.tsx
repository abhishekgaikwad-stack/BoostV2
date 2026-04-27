"use client";

import { useActionState, useEffect, useState } from "react";
import {
  type UpdateListingState,
  updateListing,
} from "@/app/(dashboard)/user/currently-selling/[offerId]/actions";
import { CredentialsFieldset } from "@/components/forms/CredentialsFieldset";
import { DecimalInput } from "@/components/forms/DecimalInput";
import { ImageUploader } from "@/components/forms/ImageUploader";
import type { AccountCredentials } from "@/lib/credentials";
import { DISCOUNT_MAX_HOURS, isDiscountActive } from "@/lib/discount";
import { formatDiscountCountdown } from "@/lib/utils";

const initialState: UpdateListingState = {};

export type EditableListing = {
  id: string;
  title: string;
  description: string | null;
  platform: string | null;
  region: string | null;
  price: number; // cents
  oldPrice: number | null; // cents
  discountPrice: number | null; // cents
  discountEndsAt: string | null; // ISO
  images: string[];
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
        <Field label="Platform">
          <input
            name="platform"
            defaultValue={listing.platform ?? ""}
            placeholder="e.g. PC, PS5, Xbox, Mobile"
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
          />
        </Field>
        <Field label="Region">
          <input
            name="region"
            defaultValue={listing.region ?? ""}
            placeholder="e.g. NA, EU, Asia, Global"
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
          />
        </Field>
      </div>

      <Field label="Screenshots">
        <ImageUploader name="images" initialUrls={listing.images} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Selling price (€, max 1000)">
          <DecimalInput
            name="price"
            required
            max={1000}
            defaultValue={(listing.price / 100).toFixed(2)}
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
          />
        </Field>
        <Field label="MRP / old price (€)">
          <DecimalInput
            name="oldPrice"
            defaultValue={
              listing.oldPrice != null ? (listing.oldPrice / 100).toFixed(2) : ""
            }
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
          />
        </Field>
      </div>

      <DiscountSection
        discountPrice={listing.discountPrice}
        discountEndsAt={listing.discountEndsAt}
      />

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

/**
 * Two-mode discount section:
 * - Active:   read-only card showing the running price + live countdown. The
 *             seller cannot stop, pause, or edit while it's running.
 * - Inactive: empty inputs. Leave them blank to not run a discount.
 */
function DiscountSection({
  discountPrice,
  discountEndsAt,
}: {
  discountPrice: number | null;
  discountEndsAt: string | null;
}) {
  const active = isDiscountActive(discountPrice, discountEndsAt);
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-brand-border-light p-4">
      <legend className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
        Run discount
      </legend>
      {active && discountEndsAt && discountPrice != null ? (
        <ActiveDiscountCard price={discountPrice} endsAt={discountEndsAt} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Discount price (€)">
            <DecimalInput
              name="discountPrice"
              placeholder="e.g. 30.00"
              className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
            />
          </Field>
          <Field label={`Duration (hrs, max ${DISCOUNT_MAX_HOURS})`}>
            <DecimalInput
              name="discountHours"
              decimals={1}
              max={DISCOUNT_MAX_HOURS}
              placeholder="24"
              className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
            />
          </Field>
          <p className="col-span-2 font-display text-[12px] leading-4 text-brand-text-secondary-light">
            Leave both blank to skip. Discount price must be less than the
            selling price. Once started, a discount cannot be stopped or
            paused — it runs until it expires or you delete the listing.
          </p>
        </div>
      )}
    </fieldset>
  );
}

function ActiveDiscountCard({
  price,
  endsAt,
}: {
  price: number; // cents
  endsAt: string;
}) {
  const [label, setLabel] = useState<string | null>(() =>
    formatDiscountCountdown(endsAt),
  );

  useEffect(() => {
    const tick = () => setLabel(formatDiscountCountdown(endsAt));
    tick();
    const handle = window.setInterval(tick, 1000);
    return () => window.clearInterval(handle);
  }, [endsAt]);

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-brand-bg-pill px-4 py-3">
      <span className="font-display text-[12px] font-medium text-brand-text-secondary-light">
        A discount of{" "}
        <span className="text-brand-text-primary-light">
          €{(price / 100).toFixed(2)}
        </span>{" "}
        is currently running.
      </span>
      <span className="font-display text-[13px] font-medium text-brand-text-primary-light">
        {label ? `Ends in ${label}` : "Ending now…"}
      </span>
      <span className="font-display text-[11px] leading-4 text-brand-text-secondary-light">
        You can start a new discount after this one ends.
      </span>
    </div>
  );
}
