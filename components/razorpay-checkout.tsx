"use client";

import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function RazorpayCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPayment() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payments/create-order", { method: "POST" });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error ?? "Unable to start payment.");
      if (order.alreadyPaid) { router.replace("/register"); return; }
      if (!window.Razorpay) throw new Error("Payment checkout is still loading. Please try again.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "GenXCode Hackathon",
        description: "Participant pass",
        order_id: order.orderId,
        theme: { color: "#1a56db" },
        retry: { enabled: true },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (result: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verification = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result),
          });
          const verified = await verification.json();
          if (!verification.ok || !verified.success) {
            setError(verified.error ?? "Payment verification is pending. Refresh in a moment.");
            setLoading(false);
            return;
          }
          router.replace("/register");
          router.refresh();
        },
      });
      checkout.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <div className="rounded-2xl border border-[#e4e4dd] bg-white p-7">
      <p className="eyebrow">GENXCODE HACKATHON 2026</p>
      <div className="mt-5 flex items-end gap-2"><span className="editorial text-6xl">₹79</span><span className="pb-2 text-sm text-[#697386]">one-time participant pass</span></div>
      <p className="mt-4 text-sm leading-6 text-[#697386]">Complete your pass payment to unlock the participant dashboard and continue with your hackathon registration.</p>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button onClick={startPayment} disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a56db] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#1649bd] disabled:opacity-60">
        {loading ? <><LoaderCircle className="animate-spin" size={17}/>Please wait…</> : "Pay ₹79 and get your pass"}
      </button>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8992a1]"><ShieldCheck size={14}/> Secure payment powered by Razorpay</p>
    </div>
  </>;
}
