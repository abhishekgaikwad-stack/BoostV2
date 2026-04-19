"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-border-subtle bg-black px-4 font-display text-[12px] font-medium text-white transition hover:bg-brand-bg-elevated disabled:opacity-60"
    >
      <span>{pending ? "Logging out…" : "Log out"}</span>
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
