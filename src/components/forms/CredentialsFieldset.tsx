"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import type { AccountCredentials } from "@/lib/credentials";

type Props = {
  initial?: AccountCredentials | null;
};

export function CredentialsFieldset({ initial }: Props) {
  const [reveal, setReveal] = useState(false);
  const pwType = reveal ? "text" : "password";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-brand-border-light bg-brand-bg-light p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-brand-text-primary-light">
          <Lock className="h-4 w-4" strokeWidth={1.5} />
          <span className="font-display text-[13px] font-medium">
            Account credentials (private)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-display text-[12px] font-medium text-brand-text-secondary-light transition hover:bg-brand-bg-pill hover:text-brand-text-primary-light"
        >
          {reveal ? (
            <>
              <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
              Reveal
            </>
          )}
        </button>
      </header>

      <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
        Encrypted at rest. Only you can view this; the buyer receives it
        automatically once their payment clears.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          name="cred_login"
          label="Login / username"
          defaultValue={initial?.login ?? ""}
        />
        <Input
          name="cred_password"
          label="Password"
          type={pwType}
          defaultValue={initial?.password ?? ""}
        />
        <Input
          name="cred_email"
          label="Email"
          defaultValue={initial?.email ?? ""}
        />
        <Input
          name="cred_email_password"
          label="Email password"
          type={pwType}
          defaultValue={initial?.emailPassword ?? ""}
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
          Notes for the buyer
        </span>
        <textarea
          name="cred_notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="Backup codes, recovery phrases, anything the buyer needs to know."
          className="w-full resize-y rounded-xl bg-white px-4 py-3 font-display text-[13px] font-medium leading-5 text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
        />
      </label>
    </section>
  );
}

function Input({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
        {label}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-xl bg-white px-4 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
      />
    </label>
  );
}
