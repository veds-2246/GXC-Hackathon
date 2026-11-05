import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay is not configured yet. Please try again later." }, { status: 503 });

    const admin = createAdminClient();
    const { data: paid } = await admin.from("payment_orders").select("id,status").eq("user_id", user.id).eq("status", "paid").limit(1).maybeSingle();
    if (paid) return NextResponse.json({ alreadyPaid: true });

    const { data: reusable } = await admin.from("payment_orders")
      .select("provider_order_id,amount_paise,currency")
      .eq("user_id", user.id).in("status", ["created", "pending"])
      .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (reusable) return NextResponse.json({ keyId, orderId: reusable.provider_order_id, amount: reusable.amount_paise, currency: reusable.currency });

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 7900, currency: "INR", receipt: "gxc_" + crypto.randomUUID().replaceAll("-", "").slice(0, 20), notes: { user_id: user.id, event: "GenXCode Hackathon 2026" } }),
      cache: "no-store",
    });
    const order = await response.json();
    if (!response.ok) return NextResponse.json({ error: order.error?.description ?? "Could not create the Razorpay order." }, { status: 502 });

    const { error: insertError } = await admin.from("payment_orders").insert({
      user_id: user.id, provider: "razorpay", provider_order_id: order.id,
      amount_paise: 7900, currency: "INR", status: "created",
    });
    if (insertError) throw insertError;

    return NextResponse.json({ keyId, orderId: order.id, amount: 7900, currency: "INR" });
  } catch (error) {
    console.error("Razorpay create order failed", error);
    return NextResponse.json({ error: "Unable to start payment right now." }, { status: 500 });
  }
}
