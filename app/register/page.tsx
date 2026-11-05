import { BrandLockup } from "@/components/brand-lockup";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegistrationWorkflow } from "@/components/registration-workflow";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: payment } = await supabase.from("payment_orders")
    .select("id").eq("user_id", user.id).eq("status", "paid")
    .order("paid_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment) redirect("/checkout");

  const [{ data: profile }, { data: registration }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,college,branch,study_year,city,github_url,linkedin_url").eq("id", user.id).maybeSingle(),
    supabase.from("registrations").select("application_number").eq("created_by", user.id).neq("status", "cancelled").maybeSingle(),
  ]);
  const fallbackProfile = { full_name:null, phone:null, college:null, branch:null, study_year:null, city:null, github_url:null, linkedin_url:null };

  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-3"><div className="surface-glass-nav flex h-[72px] items-center justify-between rounded-2xl px-5 sm:px-6">
      <BrandLockup />
      <span className="rounded-full bg-[#f4effc] px-3 py-2 text-xs font-semibold text-[#5f2295]">Payment verified</span>
    </div></header>
    <div className="container-shell mx-auto max-w-[820px] py-12 sm:py-16">
      <p className="eyebrow mb-4">HACKATHON REGISTRATION</p>
      <h1 className="editorial text-5xl leading-[.98] sm:text-6xl">One step closer.<br/><span className="italic text-[#5f2295]">Let’s get you registered.</span></h1>
      <p className="mt-5 mb-10 max-w-xl text-sm leading-6 text-[#76678a]">Your pass payment is verified. Complete your participant profile. We’ll submit your individual hackathon registration automatically.</p>
      <RegistrationWorkflow initialProfile={profile ?? fallbackProfile} existing={registration ?? null} paymentOrderId={payment.id}/>
    </div>
  </main>;
}
