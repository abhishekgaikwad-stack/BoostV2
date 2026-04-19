"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
];

const currencies = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "BRL", label: "BRL — Brazilian Real" },
];

const countries = [
  { code: "US", label: "United States" },
  { code: "IN", label: "India" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "BR", label: "Brazil" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
];

export function RegionPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleSave() {
    // TODO: persist preference (localStorage / Supabase user profile / cookie)
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[4px]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[460px] rounded-[32px] bg-brand-bg-surface p-10 text-brand-text-primary-dark shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl text-brand-text-secondary-dark transition hover:bg-brand-bg-elevated hover:text-brand-text-primary-dark"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[24px] font-bold leading-7">
            Choose your region
          </h2>
          <p className="font-display text-[13px] font-medium leading-5 text-brand-text-secondary-dark">
            Set your preferences for language, currency, and country.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Field label="Language">
            <Select value={language} onChange={setLanguage} options={languages} />
          </Field>
          <Field label="Currency">
            <Select value={currency} onChange={setCurrency} options={currencies} />
          </Field>
          <Field label="Country">
            <Select value={country} onChange={setCountry} options={countries} />
          </Field>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          Save preferences
        </button>
      </div>
    </div>
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
      <span className="font-display text-[11px] font-medium leading-4 uppercase tracking-[0.08em] text-brand-text-secondary-dark">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ code: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-14 w-full appearance-none items-center rounded-2xl bg-brand-bg-elevated px-5 pr-12 font-display text-[14px] font-medium text-brand-text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-border"
      >
        {options.map((option) => (
          <option
            key={option.code}
            value={option.code}
            className="bg-brand-bg-elevated text-brand-text-primary-dark"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-text-secondary-dark"
        strokeWidth={1.5}
      />
    </div>
  );
}
