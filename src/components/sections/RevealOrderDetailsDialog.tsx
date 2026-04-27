"use client";

import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Lock,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { gameImage } from "@/lib/images";
import type { AccountCredentials } from "@/lib/credentials";
import type { Order } from "@/lib/orders";
import {
  revealOrderCredentials,
  type RevealCredentialsResult,
} from "@/lib/orders-reveal";

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
};

type Stage = "confirm" | "revealing" | "revealed" | "error";

const credentialFieldOrder: Array<{
  key: keyof AccountCredentials;
  label: string;
  secret?: boolean;
}> = [
  { key: "login", label: "Login" },
  { key: "password", label: "Password", secret: true },
  { key: "email", label: "Email" },
  { key: "emailPassword", label: "Email password", secret: true },
  { key: "notes", label: "Notes" },
];

export function RevealOrderDetailsDialog({ order, open, onClose }: Props) {
  const offer = order.offer;
  const isAlreadyRevealed = Boolean(order.revealedAt);

  const [stage, setStage] = useState<Stage>(
    isAlreadyRevealed ? "revealing" : "confirm",
  );
  const [confirmPlatform, setConfirmPlatform] = useState(false);
  const [confirmRegion, setConfirmRegion] = useState(false);
  const [credentials, setCredentials] = useState<AccountCredentials | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset / auto-fetch when the dialog opens.
  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
    setCredentials(null);
    setConfirmPlatform(false);
    setConfirmRegion(false);
    if (isAlreadyRevealed) {
      setStage("revealing");
      void runReveal();
    } else {
      setStage("confirm");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function runReveal() {
    setStage("revealing");
    const result: RevealCredentialsResult = await revealOrderCredentials(
      order.id,
    );
    if ("error" in result) {
      setErrorMessage(result.error);
      setStage("error");
      return;
    }
    setCredentials(result.credentials);
    setStage("revealed");
  }

  if (!open) return null;

  const platformValue = offer?.platform ?? "—";
  const regionValue = offer?.region ?? "—";
  const canReveal = confirmPlatform && confirmRegion;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reveal order details"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-brand-bg-light text-brand-text-primary-light transition hover:bg-brand-bg-pill"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="flex flex-col gap-5 p-6">
          {offer ? (
            <header className="flex items-center gap-4">
              <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-bg-pill">
                <Image
                  src={gameImage(offer.game.slug)}
                  alt={offer.game.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-[12px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
                  {offer.game.name}
                </span>
                <h2 className="truncate font-display text-[16px] font-medium leading-5 text-brand-text-primary-light">
                  {offer.title}
                </h2>
              </div>
            </header>
          ) : null}

          {stage === "confirm" ? (
            <ConfirmStage
              platformValue={platformValue}
              regionValue={regionValue}
              confirmPlatform={confirmPlatform}
              confirmRegion={confirmRegion}
              onPlatformChange={setConfirmPlatform}
              onRegionChange={setConfirmRegion}
              canReveal={canReveal}
              onReveal={runReveal}
              onCancel={onClose}
            />
          ) : null}

          {stage === "revealing" ? (
            <div className="flex items-center justify-center gap-3 py-8 font-display text-[13px] text-brand-text-secondary-light">
              <Lock className="h-4 w-4 animate-pulse" strokeWidth={1.5} />
              Decrypting credentials…
            </div>
          ) : null}

          {stage === "revealed" && credentials ? (
            <RevealedStage credentials={credentials} onClose={onClose} />
          ) : null}

          {stage === "error" ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand-discount/30 bg-brand-discount/5 p-4">
              <p className="font-display text-[13px] font-medium text-brand-discount">
                {errorMessage ?? "Something went wrong."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="self-end font-display text-[12px] font-medium text-brand-text-secondary-light underline hover:text-brand-text-primary-light"
              >
                Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ConfirmStage({
  platformValue,
  regionValue,
  confirmPlatform,
  confirmRegion,
  onPlatformChange,
  onRegionChange,
  canReveal,
  onReveal,
  onCancel,
}: {
  platformValue: string;
  regionValue: string;
  confirmPlatform: boolean;
  confirmRegion: boolean;
  onPlatformChange: (next: boolean) => void;
  onRegionChange: (next: boolean) => void;
  canReveal: boolean;
  onReveal: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <CheckRow
          checked={confirmPlatform}
          onChange={onPlatformChange}
          label={
            <>
              I confirm platform{" "}
              <strong className="font-medium text-brand-text-primary-light">
                {platformValue}
              </strong>{" "}
              is correct
            </>
          }
        />
        <CheckRow
          checked={confirmRegion}
          onChange={onRegionChange}
          label={
            <>
              I confirm region{" "}
              <strong className="font-medium text-brand-text-primary-light">
                {regionValue}
              </strong>{" "}
              is correct
            </>
          }
        />
      </div>

      <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
        Once revealed, the platform and region confirmations are recorded and
        the credentials remain accessible from this order.
      </p>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="font-display text-[13px] font-medium text-brand-text-secondary-light underline hover:text-brand-text-primary-light"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onReveal}
          disabled={!canReveal}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-5 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="h-4 w-4" strokeWidth={1.75} />
          Reveal details
        </button>
      </div>
    </>
  );
}

function RevealedStage({
  credentials,
  onClose,
}: {
  credentials: AccountCredentials;
  onClose: () => void;
}) {
  const visible = credentialFieldOrder.filter(
    (f) => credentials[f.key] && (credentials[f.key] as string).length > 0,
  );

  if (visible.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-border-light bg-brand-bg-light p-4">
        <p className="font-display text-[13px] text-brand-text-secondary-light">
          The seller didn't add any credentials to this listing.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="self-end font-display text-[12px] font-medium text-brand-text-secondary-light underline hover:text-brand-text-primary-light"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
          Account credentials
        </span>
        <span className="font-display text-[11px] text-brand-text-tertiary-dark">
          Private — do not share these.
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {visible.map((field) => (
          <CredentialRow
            key={field.key}
            label={field.label}
            value={credentials[field.key] as string}
            secret={field.secret}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-brand-border-light bg-white font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        Close
      </button>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  secret,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [reveal, setReveal] = useState(!secret);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail in non-secure contexts; ignore silently.
    }
  }

  return (
    <li className="flex flex-col gap-1 rounded-2xl border border-brand-border-light bg-brand-bg-light p-3">
      <span className="font-display text-[10px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 truncate font-mono text-[13px] text-brand-text-primary-light ${
            secret && !reveal ? "tracking-widest" : ""
          }`}
        >
          {secret && !reveal ? "•".repeat(Math.min(value.length, 12)) : value}
        </span>
        {secret ? (
          <button
            type="button"
            aria-label={reveal ? "Hide" : "Show"}
            onClick={() => setReveal((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-brand-border-light bg-white text-brand-text-primary-light transition hover:bg-brand-bg-pill"
          >
            {reveal ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy"
          className="grid h-8 w-8 place-items-center rounded-lg border border-brand-border-light bg-white text-brand-text-primary-light transition hover:bg-brand-bg-pill"
        >
          {copied ? (
            <Check className="h-4 w-4 text-brand-success" strokeWidth={2} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </li>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-brand-border-light bg-brand-bg-light p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border border-brand-border-light bg-white accent-brand-accent"
      />
      <span className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
        {label}
      </span>
    </label>
  );
}
