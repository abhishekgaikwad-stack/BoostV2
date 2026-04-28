"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { useActionState } from "react";
import {
  type CreateListingState,
  createListing,
} from "@/app/(dashboard)/sell/actions";
import { CharCounter, useCharLength } from "@/components/forms/CharCounter";
import { CredentialsFieldset } from "@/components/forms/CredentialsFieldset";
import { DecimalInput } from "@/components/forms/DecimalInput";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { useAutoDetectListingAttrs } from "@/components/forms/useAutoDetectListingAttrs";
import { DISCOUNT_MAX_HOURS } from "@/lib/discount";
import { LISTING_LIMITS } from "@/lib/listing-limits";
import type { Game } from "@/types";

const initialState: CreateListingState = {};

export function CreateListingForm({ games }: { games: Game[] }) {
  const [state, formAction, pending] = useActionState(
    createListing,
    initialState,
  );
  const {
    platform,
    region,
    setPlatform,
    setRegion,
    detecting,
    titleRef,
    descriptionRef,
    onAutoDetectBlur,
  } = useAutoDetectListingAttrs();
  const titleLength = useCharLength(titleRef);
  const descriptionLength = useCharLength(descriptionRef);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-[32px] border border-brand-border-light bg-white p-6"
    >
      <Field label="Game">
        <div className="relative">
          <select
            name="gameId"
            required
            defaultValue=""
            className="h-12 w-full appearance-none rounded-xl bg-brand-bg-pill px-4 pr-10 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
          >
            <option value="" disabled>
              Select a game
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary-dark"
            strokeWidth={1.5}
          />
        </div>
      </Field>

      <Field label="Title">
        <input
          ref={titleRef}
          name="title"
          required
          onBlur={onAutoDetectBlur}
          placeholder="e.g. 20M Valorant account with all agents"
          className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
        />
        <CharCounter length={titleLength} max={LISTING_LIMITS.title} />
      </Field>

      <Field label="Description">
        <textarea
          ref={descriptionRef}
          name="description"
          rows={6}
          onBlur={onAutoDetectBlur}
          placeholder="Explain what's on the account — unlocked agents, rank, warnings, anything the buyer should know."
          className="w-full resize-y rounded-xl bg-brand-bg-pill p-4 font-display text-[13px] font-medium leading-5 text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
        />
        <CharCounter length={descriptionLength} max={LISTING_LIMITS.description} />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Platform">
            <input
              name="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. PC, PS5, Xbox, Mobile"
              className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
            />
            <CharCounter length={platform.length} max={LISTING_LIMITS.platform} />
          </Field>
          <Field label="Region">
            <input
              name="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. NA, EU, Asia, Global"
              className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
            />
            <CharCounter length={region.length} max={LISTING_LIMITS.region} />
          </Field>
        </div>
        {detecting ? (
          <span className="flex items-center gap-2 font-display text-[12px] font-medium text-brand-text-secondary-light">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-accent" strokeWidth={1.75} />
            Detecting platform and region from your title and description…
          </span>
        ) : null}
      </div>

      <Field label="Screenshots (optional)">
        <ImageUploader name="images" />
      </Field>

      <CredentialsFieldset />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Selling price (€, max 1000)">
          <DecimalInput
            name="price"
            required
            max={1000}
            placeholder="40.20"
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
          />
        </Field>
        <Field label="MRP / old price (€)">
          <DecimalInput
            name="oldPrice"
            placeholder="80.40"
            className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-2xl border border-brand-border-light p-4">
        <legend className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
          Run discount (optional)
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Discount price (€)">
            <DecimalInput
              name="discountPrice"
              placeholder="e.g. 30.00"
              className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
            />
          </Field>
          <Field label={`Duration (hrs, max ${DISCOUNT_MAX_HOURS})`}>
            <DecimalInput
              name="discountHours"
              decimals={1}
              max={DISCOUNT_MAX_HOURS}
              placeholder="24"
              className="h-12 w-full rounded-xl bg-brand-bg-pill px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
            />
          </Field>
        </div>
        <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
          Leave both blank to skip. Discount price must be less than the
          selling price. Once started, a discount cannot be stopped or paused.
        </p>
      </fieldset>

      {state.error ? (
        <p className="font-display text-[12px] font-medium text-brand-discount">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-black font-display text-[14px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create listing"}
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
