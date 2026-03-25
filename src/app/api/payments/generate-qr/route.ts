import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateQrSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/generate-qr
 * Generates a payment QR code for an order.
 * PayRight.my API integration - currently mock implementation.
 * Replace PAYRIGHT_API_URL and PAYRIGHT_API_KEY env vars when ready.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateQrSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { orderId } = parsed.data;

    const supabase = createServerSupabaseClient();

    // Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, outlet_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    const payRightUrl = process.env.PAYRIGHT_API_URL;
    const payRightKey = process.env.PAYRIGHT_API_KEY;

    if (payRightUrl && payRightKey) {
      // Real PayRight.my integration
      const response = await fetch(`${payRightUrl}/generate-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payRightKey}`,
        },
        body: JSON.stringify({
          amount: Number(order.total),
          reference: order.order_number,
          description: `Order #${order.order_number}`,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: "Payment QR generation failed" }, { status: 500 });
      }

      const data = await response.json();
      return NextResponse.json({
        qr_url: data.qr_url || data.qr_code_url,
        payment_reference: data.reference || data.payment_id,
        amount: Number(order.total),
        order_number: order.order_number,
      });
    }

    // Mock response when PayRight is not configured
    const mockReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Store the payment reference
    await supabase
      .from("orders")
      .update({ payment_reference: mockReference })
      .eq("id", orderId);

    return NextResponse.json({
      qr_url: null, // No real QR in mock mode
      payment_reference: mockReference,
      amount: Number(order.total),
      order_number: order.order_number,
      mock: true,
      message: "PayRight not configured. Use cash payment or configure PAYRIGHT_API_URL and PAYRIGHT_API_KEY.",
    });
  } catch {
    return NextResponse.json({ error: "Payment generation failed" }, { status: 500 });
  }
}
