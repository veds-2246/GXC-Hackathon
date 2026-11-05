import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (!["payment.captured", "order.paid"].includes(event.event)) return NextResponse.json({ received: true });

    const payment = event.payload?.payment?.entity;
    const order = event.payload?.order?.entity;
    const orderId = payment?.order_id ?? order?.id;
    const paymentId = payment?.id;
    const amount = payment?.amount ?? order?.amount;
    const currency = payment?.currency ?? order?.currency;
    const isCaptured = event.event === "order.paid" || payment?.status === "captured";
    if (!orderId || !isCaptured || amount !== 7900 || currency !== "INR") return NextResponse.json({ received: true });

    const admin = createAdminClient();
    const { error } = await admin.from("payment_orders").update({
      provider_payment_id: paymentId ?? undefined,
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("provider_order_id", orderId).in("status", ["created", "pending", "paid"]);
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
