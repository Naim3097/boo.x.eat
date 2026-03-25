import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/webhook
 * Handles payment confirmation callbacks from PayRight.my.
 * Updates order payment status when payment is confirmed.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify webhook signature if PayRight provides one
    const webhookSecret = process.env.PAYRIGHT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-payright-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      // TODO: Implement signature verification when PayRight docs are available
    }

    const { reference, status, payment_method } = body;

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find order by payment reference
    const { data: order, error: findErr } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("payment_reference", reference)
      .single();

    if (findErr || !order) {
      return NextResponse.json({ error: "Order not found for reference" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ message: "Already processed" });
    }

    if (status === "success" || status === "completed" || status === "paid") {
      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: payment_method || "qr_payment",
        })
        .eq("id", order.id);

      if (updateErr) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }

      return NextResponse.json({ message: "Payment recorded successfully" });
    }

    return NextResponse.json({ message: "Payment status noted", status });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
