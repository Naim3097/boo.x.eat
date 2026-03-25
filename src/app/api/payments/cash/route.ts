import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cashPaymentSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/cash
 * Records a cash payment for an order.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cashPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { orderId } = parsed.data;

    const supabase = createServerSupabaseClient();

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, payment_status, total")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // Update payment status
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        payment_method: "cash",
        payment_reference: `CASH-${Date.now()}`,
      })
      .eq("id", orderId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Cash payment recorded",
      amount: Number(order.total),
    });
  } catch {
    return NextResponse.json({ error: "Payment recording failed" }, { status: 500 });
  }
}
