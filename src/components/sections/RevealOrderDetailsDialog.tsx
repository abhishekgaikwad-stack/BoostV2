"use client";

import { ArrowLeft, Check, Copy, Eye, EyeOff, Lock, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { gameImage } from "@/lib/images";
import type { AccountCredentials } from "@/lib/credentials";
import type { Order, ReceivedChecks } from "@/lib/orders";
import { confirmOrderReceived } from "@/lib/orders-confirm";
import {
  revealOrderCredentials,
  type RevealCredentialsResult,
} from "@/lib/orders-reveal";

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
  /** Fires after a successful Confirm-receipt submit so the parent can
   *  open the review dialog (the next sequential step). */
  onConfirmedReceipt?: () => void;
};

type Stage =
  | "confirm"
  | "revealing"
  | "revealed"
  | "confirm-received"
  | "error";

const credentialFields: Array<{
  key: keyof Omit<AccountCredentials, "notes">;
  label: string;
  secret?: boolean;
}> = [
  { key: "login", label: "Login / username" },
  { key: "password", label: "Password", secret: true },
  { key: "email", label: "Email" },
  { key: "emailPassword", label: "Email password", secret: true },
];

export function RevealOrderDetailsDialog({
  order,
  open,
  onClose,
  onConfirmedReceipt,
}: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded-3xl bg-[#1a1a1a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#2a2a2a] text-white transition hover:bg-[#333333]"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="flex flex-col gap-5 p-6">
          {offer ? (
            <header className="flex items-center gap-4">
              <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-2xl bg-[#2a2a2a]">
                <Image
                  src={gameImage(offer.game.slug)}
                  alt={offer.game.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-[12px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-dark">
                  {offer.game.name}
                </span>
                <h2 className="truncate font-display text-[16px] font-medium leading-5 text-white">
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
            <div className="flex items-center justify-center gap-3 py-8 font-display text-[13px] text-brand-text-secondary-dark">
              <Lock className="h-4 w-4 animate-pulse" strokeWidth={1.5} />
              Decrypting credentials…
            </div>
          ) : null}

          {stage === "revealed" && credentials ? (
            <RevealedStage
              credentials={credentials}
              markedReceivedAt={order.markedReceivedAt}
              onMarkReceivedClick={() => setStage("confirm-received")}
              onClose={onClose}
            />
          ) : null}

          {stage === "confirm-received" && credentials ? (
            <ConfirmReceivedStage
              orderId={order.id}
              hasEmailCredential={Boolean(
                credentials.email && credentials.email.length > 0,
              )}
              onBack={() => setStage("revealed")}
              onSuccess={() => {
                onClose();
                onConfirmedReceipt?.();
              }}
            />
          ) : null}

          {stage === "error" ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand-discount/30 bg-brand-discount/10 p-4">
              <p className="font-display text-[13px] font-medium text-brand-discount">
                {errorMessage ?? "Something went wrong."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="self-end font-display text-[12px] font-medium text-brand-text-secondary-dark underline hover:text-white"
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
              <strong className="font-medium text-white">
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
              <strong className="font-medium text-white">{regionValue}</strong>{" "}
              is correct
            </>
          }
        />
      </div>

      <p className="font-display text-[12px] leading-4 text-brand-text-secondary-dark">
        Once revealed, the platform and region confirmations are recorded and
        the credentials remain accessible from this order.
      </p>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="font-display text-[13px] font-medium text-brand-text-secondary-dark underline hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onReveal}
          disabled={!canReveal}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-5 font-display text-[13px] font-medium text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
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
  markedReceivedAt,
  onMarkReceivedClick,
  onClose,
}: {
  credentials: AccountCredentials;
  markedReceivedAt: string | null;
  onMarkReceivedClick: () => void;
  onClose: () => void;
}) {
  const populated = credentialFields.filter(
    (f) => credentials[f.key] && (credentials[f.key] as string).length > 0,
  );
  const notes = credentials.notes && credentials.notes.length > 0 ? credentials.notes : null;

  if (populated.length === 0 && !notes) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-border-subtle bg-[#2a2a2a] p-4">
        <p className="font-display text-[13px] text-brand-text-secondary-dark">
          The seller didn't add any credentials to this listing.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="self-end font-display text-[12px] font-medium text-brand-text-secondary-dark underline hover:text-white"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-white">
        <Lock className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-display text-[13px] font-medium">
          Account credentials (private)
        </span>
      </div>

      {populated.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {populated.map((field) => (
            <CredentialField
              key={field.key}
              label={field.label}
              value={credentials[field.key] as string}
              secret={field.secret}
            />
          ))}
        </div>
      ) : null}

      {notes ? <NotesField value={notes} /> : null}

      {markedReceivedAt ? (
        <ReceivedIndicator markedReceivedAt={markedReceivedAt} />
      ) : (
        <button
          type="button"
          onClick={onMarkReceivedClick}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[13px] font-medium text-black transition hover:brightness-95"
        >
          <Check className="h-4 w-4" strokeWidth={2} />
          Mark as received
        </button>
      )}
    </div>
  );
}

function ReceivedIndicator({ markedReceivedAt }: { markedReceivedAt: string }) {
  const formatted = new Date(markedReceivedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-brand-success/30 bg-brand-success/10 px-4 py-3 font-display text-[13px] font-medium text-brand-success">
      <Check className="h-4 w-4" strokeWidth={2} />
      Marked as received on {formatted}
    </div>
  );
}

function ConfirmReceivedStage({
  orderId,
  hasEmailCredential,
  onBack,
  onSuccess,
}: {
  orderId: string;
  hasEmailCredential: boolean;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [accountInfoWorks, setAccountInfoWorks] = useState(false);
  const [matchesDescription, setMatchesDescription] = useState(false);
  const [emailAccess, setEmailAccess] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requiredOk =
    accountInfoWorks &&
    matchesDescription &&
    passwordChanged &&
    (!hasEmailCredential || emailAccess);

  async function handleSubmit() {
    if (!requiredOk || pending) return;
    setErrorMessage(null);
    setPending(true);
    const checks: ReceivedChecks = {
      account_info_works: accountInfoWorks,
      matches_description: matchesDescription,
      email_access: hasEmailCredential ? emailAccess : null,
      password_changed: passwordChanged,
    };
    const result = await confirmOrderReceived({ orderId, checks });
    if ("error" in result) {
      setErrorMessage(result.error);
      setPending(false);
      return;
    }
    onSuccess();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-white">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="grid h-7 w-7 place-items-center rounded-md text-brand-text-secondary-dark transition hover:bg-[#2a2a2a] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="font-display text-[16px] font-medium">
          Review and confirm your order
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <ReceivedCheckRow
          checked={accountInfoWorks}
          onChange={setAccountInfoWorks}
          label="Account info works"
        />
        <ReceivedCheckRow
          checked={matchesDescription}
          onChange={setMatchesDescription}
          label="Matches the offer description"
        />
        {hasEmailCredential ? (
          <ReceivedCheckRow
            checked={emailAccess}
            onChange={setEmailAccess}
            label="Access to email"
          />
        ) : null}
        <ReceivedCheckRow
          checked={passwordChanged}
          onChange={setPasswordChanged}
          label="Password changed"
        />
      </div>

      {errorMessage ? (
        <p className="font-display text-[12px] font-medium text-brand-discount">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!requiredOk || pending}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[13px] font-medium text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Confirming…" : "Confirm receipt"}
      </button>
    </div>
  );
}

function ReceivedCheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-brand-border-subtle bg-[#2a2a2a] px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer rounded border border-brand-border-subtle bg-[#1a1a1a] accent-brand-accent"
      />
      <span className="font-display text-[14px] font-medium text-white">
        {label}
      </span>
    </label>
  );
}

function CredentialField({
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
    <label className="flex flex-col gap-2">
      <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-dark">
        {label}
      </span>
      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#2a2a2a] px-4">
        <span className="flex-1 truncate font-display text-[14px] font-medium text-white">
          {secret && !reveal ? "•".repeat(Math.min(value.length, 12)) : value}
        </span>
        {secret ? (
          <button
            type="button"
            aria-label={reveal ? "Hide" : "Show"}
            onClick={() => setReveal((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-md text-brand-text-secondary-dark transition hover:bg-[#333333] hover:text-white"
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
          className="grid h-7 w-7 place-items-center rounded-md text-brand-text-secondary-dark transition hover:bg-[#333333] hover:text-white"
        >
          {copied ? (
            <Check className="h-4 w-4 text-brand-success" strokeWidth={2} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </label>
  );
}

function NotesField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-dark">
        Notes for the buyer
      </span>
      <div className="relative rounded-xl bg-[#2a2a2a] px-4 py-3">
        <p className="whitespace-pre-wrap pr-10 font-display text-[13px] font-medium leading-5 text-white">
          {value}
        </p>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-brand-text-secondary-dark transition hover:bg-[#333333] hover:text-white"
        >
          {copied ? (
            <Check className="h-4 w-4 text-brand-success" strokeWidth={2} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </label>
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
    <label className="flex items-start gap-3 rounded-xl border border-brand-border-subtle bg-[#2a2a2a] p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border border-brand-border-subtle bg-[#1a1a1a] accent-brand-accent"
      />
      <span className="font-display text-[13px] leading-5 text-brand-text-secondary-dark">
        {label}
      </span>
    </label>
  );
}
