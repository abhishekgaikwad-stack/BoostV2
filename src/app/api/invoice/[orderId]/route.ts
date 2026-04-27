import { NextResponse } from "next/server";
import { renderInvoicePdf } from "@/lib/invoice";
import { getMyOrder } from "@/lib/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PDF generation pulls in @react-pdf/renderer (Node-only — yoga, fontkit, etc.).
// Force the Node runtime explicitly so the route never lands on Edge.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const order = await getMyOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const pdf = await renderInvoicePdf({
    order,
    buyer: {
      name: profile?.name ?? null,
      email: user.email ?? null,
    },
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.transactionId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
