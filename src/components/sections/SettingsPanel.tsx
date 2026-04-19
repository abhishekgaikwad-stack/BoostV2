import { ProfilePictureRow } from "@/components/sections/ProfilePictureRow";
import { cn } from "@/lib/utils";

export type SettingsPanelProps = {
  email: string;
  has2FA?: boolean;
  canChangePassword?: boolean;
  className?: string;
};

export function SettingsPanel({
  email,
  has2FA = false,
  canChangePassword = false,
  className,
}: SettingsPanelProps) {
  return (
    <section
      className={cn(
        "flex flex-1 flex-col gap-8 rounded-[32px] border border-brand-border-light bg-white p-8",
        className,
      )}
    >
      <EmailRow email={email} />
      <Divider />
      <ProfilePictureRow />
      <Divider />
      <PasswordRow canChangePassword={canChangePassword} />
      <Divider />
      <TwoFactorRow enabled={has2FA} />
    </section>
  );
}

function Divider() {
  return <hr className="border-0 border-t border-brand-border-light" />;
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-[160px] shrink-0 pt-3 font-display text-[16px] font-medium leading-5 text-brand-text-primary-light">
      {children}
    </span>
  );
}

function RowNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[12px] font-normal leading-4 text-brand-text-secondary-dark">
      {children}
    </span>
  );
}

function EmailRow({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-6">
      <RowLabel>Email:</RowLabel>
      <div className="flex h-12 flex-1 items-center rounded-lg bg-[#f4f4f4] px-4 font-display text-[14px] font-medium leading-5 text-brand-text-secondary-dark">
        {email}
      </div>
      <button
        type="button"
        className="font-display text-[16px] font-extrabold leading-5 text-[#329cff] transition hover:underline"
      >
        EDIT
      </button>
    </div>
  );
}

function PasswordRow({
  canChangePassword,
}: {
  canChangePassword: boolean;
}) {
  return (
    <div className="flex items-start gap-6">
      <RowLabel>Password:</RowLabel>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canChangePassword}
          className="inline-flex h-14 w-fit items-center justify-center rounded-xl bg-black px-6 font-display text-[14px] font-medium leading-6 text-white transition hover:bg-brand-bg-surface disabled:opacity-50"
        >
          Change password
        </button>
        <RowNote>
          Password can only be changed if you are using the email/password login
          flow
        </RowNote>
      </div>
    </div>
  );
}

function TwoFactorRow({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex items-start gap-6">
      <RowLabel>Two Factor Authentication</RowLabel>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="inline-flex h-14 w-fit items-center justify-center rounded-xl bg-black px-6 font-display text-[14px] font-medium leading-6 text-white transition hover:bg-brand-bg-surface"
        >
          {enabled ? "Disable 2FA" : "Enable 2FA"}
        </button>
        <RowNote>
          {enabled
            ? "Your 2FA is currently enabled"
            : "Your 2FA is currently disabled"}
        </RowNote>
      </div>
    </div>
  );
}
