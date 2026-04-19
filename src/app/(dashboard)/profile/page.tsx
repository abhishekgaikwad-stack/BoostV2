import { redirect } from "next/navigation";
import { LoginSuccessPopup } from "@/components/sections/LoginSuccessPopup";
import { ProfileCard } from "@/components/sections/ProfileCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatRegistered(iso: string | undefined) {
  if (!iso) return "Registered";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Registered";
  return `Registered ${date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })}`;
}

function deriveDisplayName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
  id: string,
) {
  const fullName =
    typeof metadata?.full_name === "string" ? metadata.full_name : undefined;
  const name = typeof metadata?.name === "string" ? metadata.name : undefined;
  const username =
    typeof metadata?.user_name === "string" ? metadata.user_name : undefined;
  if (fullName) return fullName;
  if (name) return name;
  if (username) return username;
  if (email) return email.split("@")[0];
  return `User - ${id.slice(0, 11)}`;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { welcome } = await searchParams;

  const metadata = user.user_metadata ?? {};
  const avatarUrl =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  // TODO: once Prisma migrations are live, fetch the local User row and read isSeller
  // from it. For now we default to false — override via metadata.isSeller in Supabase
  // for a quick preview of the seller variant.
  const isSeller = metadata.isSeller === true;

  return (
    <div className="flex flex-col items-start gap-8">
      <h1 className="font-display text-[28px] font-bold leading-8 text-brand-text-primary-light">
        Profile
      </h1>
      <ProfileCard
        displayName={deriveDisplayName(metadata, user.email, user.id)}
        registeredLabel={formatRegistered(user.created_at)}
        avatarUrl={avatarUrl}
        isSeller={isSeller}
        walletBalance={640.2}
        onHoldAmount={45.9}
        potentialEarnings={20000}
        currency="€"
      />
      {welcome === "1" ? <LoginSuccessPopup /> : null}
    </div>
  );
}
