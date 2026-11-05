import { BrandLockup } from "@/components/brand-lockup";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RazorpayCheckout } from "@/components/razorpay-checkout";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: paid } = await supabase.from("payment_orders").select("id").eq("user_id", user.id).eq("status", "paid").limit(1).maybeSingle();
  if (paid) redirect("/register");

  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-3"><div className="surface-glass-nav flex h-[72px] items-center rounded-2xl px-5 sm:px-6"><BrandLockup /></div></header>
    <section className="container-shell mx-auto grid max-w-5xl items-center gap-12 py-16 md:grid-cols-[1fr_.8fr]">
      <div className="surface-glass-panel card-hover rounded-[2rem] p-7 sm:p-9"><p className="eyebrow mb-4">YOUR ENTRY TO THE HACKATHON</p><h1 className="editorial text-5xl leading-[.98] sm:text-6xl">One pass.<br/><span className="italic text-[#5f2295]">Three days.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-[#76678a]">Your participant pass covers entry into the GenXCode Hackathon registration journey. After payment is verified, you can complete your profile and register for the hackathon.</p></div>
      <RazorpayCheckout />
    </section>
  </main>;
}
