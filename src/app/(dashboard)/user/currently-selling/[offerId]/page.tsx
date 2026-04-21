import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  type EditableListing,
  EditListingForm,
} from "@/components/sections/EditListingForm";
import { readCredentials } from "@/lib/credentials";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ListingRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  old_price: number | null;
  images: string[];
  seller_id: string;
  game: { slug: string; name: string };
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("accounts")
    .select(
      "id, title, description, price, old_price, images, seller_id, game:games(slug, name)",
    )
    .eq("id", offerId)
    .maybeSingle();
  if (error || !data) notFound();

  const row = data as unknown as ListingRow;
  if (row.seller_id !== user.id) {
    // Not the owner — pretend it doesn't exist rather than leaking existence.
    notFound();
  }

  const credentials = await readCredentials(offerId);

  const listing: EditableListing = {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    oldPrice: row.old_price,
    images: row.images ?? [],
    game: row.game,
  };

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <Link
        href="/user/currently-selling"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to currently selling
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Manage listing
        </h1>
        <p className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
          Edit the public fields and the private credentials that will be
          delivered to the buyer on purchase.
        </p>
      </div>

      <EditListingForm listing={listing} credentials={credentials} />
    </div>
  );
}
