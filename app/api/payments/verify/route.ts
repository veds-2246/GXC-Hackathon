import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const body = await request.json();
    const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!orderId || !paymentId || !signature || !keyId || !keySecret) return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });

    const admin = createAdminClient();
    const { data: paymentOrder } = await admin.from("payment_orders").select("id,user_id,amount_paise,currency,status,provider_payment_id")
      .eq("provider_order_id", orderId).eq("user_id", user.id).maybeSingle();
    if (!paymentOrder) return NextResponse.json({ error: "This payment order does not belong to your account." }, { status: 404 });
    if (paymentOrder.status === "paid") return NextResponse.json({ success: true });

    const expected = createHmac("sha256", keySecret).update(orderId + "|" + paymentId).digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const paymentResponse = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId), {
      headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64") },
      cache: "no-store",
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || payment.order_id !== orderId || payment.status !== "captured" || payment.amount !== 7900 || payment.currency !== "INR") {
      return NextResponse.json({ error: "Payment is not captured or the payment details do not match." }, { status: 409 });
    }

    const { error: updateError } = await admin.from("payment_orders").update({
      provider_payment_id: paymentId, status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", paymentOrder.id).eq("user_id", user.id);
    if (updateError) throw updateError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay verification failed", error);
    return NextResponse.json({ error: "Could not verify payment. If money was deducted, wait a moment and refresh this page." }, { status: 500 });
  }
}
