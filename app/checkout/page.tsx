import { BrandLockup } from "@/components/brand-lockup";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RazorpayCheckout } from "@/components/razorpay-checkout";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: paid } = await supabase.from("payment_orders").select("id").eq("user_id", user.id).eq("status", "paid").limit(1).maybeSingle();
  if (paid) redirect("/register");

  return <main className="min-h-screen bg-[#fafaf7]">
    <header className="border-b border-[#e4e4dd] bg-white"><div className="container-shell flex h-[72px] items-center"><BrandLockup /></div></header>
    <section className="container-shell mx-auto grid max-w-5xl items-center gap-12 py-16 md:grid-cols-[1fr_.8fr]">
      <div><p className="eyebrow mb-4">YOUR ENTRY TO THE FEST</p><h1 className="editorial text-5xl leading-[.98] sm:text-6xl">One pass.<br/><span className="italic text-[#1a56db]">Three days.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-[#697386]">Your participant pass covers entry into the GenXCode Hackathon registration journey. After payment is verified, you can complete your profile and register for the hackathon.</p></div>
      <RazorpayCheckout />
    </section>
  </main>;
}
