import { NextResponse } from "next/server";
import { renderInvoicePdf } from "@/lib/invoice";
import { getMyOrder } from "@/lib/orders";
import { invoicePerUserPerMinute } from "@/lib/rate-limit";
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

  // Throttle before the (CPU-heavy) PDF render. A buyer hammering their
  // own order's invoice still burns Node compute even though ownership
  // is enforced below.
  const quota = await invoicePerUserPerMinute.limit(user.id);
  if (!quota.success) {
    return NextResponse.json(
      {
        error: "Too many invoice downloads. Try again in a minute.",
        retryAt: quota.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(quota.limit),
          "X-RateLimit-Remaining": String(quota.remaining),
          "X-RateLimit-Reset": String(quota.reset),
        },
      },
    );
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
      "Content-Disposition": `attachment; filename="invoice-${order.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
