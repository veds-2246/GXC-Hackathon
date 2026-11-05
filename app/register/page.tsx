import Link from "next/link";
import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";
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

  const [{ data: profile }, { data: problems }, { data: registration }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,college,branch,study_year,city,github_url,linkedin_url").eq("id", user.id).maybeSingle(),
    supabase.from("problem_statements").select("id,title,summary,domain,difficulty,max_slots,filled_slots").eq("is_active", true).order("display_order"),
    supabase.from("registrations").select("application_number").eq("created_by", user.id).neq("status", "cancelled").maybeSingle(),
  ]);
  const fallbackProfile = { full_name:null, phone:null, college:null, branch:null, study_year:null, city:null, github_url:null, linkedin_url:null };

  return <main className="min-h-screen bg-[#fafaf7]">
    <header className="border-b border-[#e4e4dd] bg-white"><div className="container-shell flex h-[72px] items-center justify-between">
      <Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={19}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Registration</span></span></Link>
      <span className="text-xs font-semibold text-[#1e8e3e]">Payment verified</span>
    </div></header>
    <div className="container-shell mx-auto max-w-[820px] py-12 sm:py-16">
      <p className="eyebrow mb-4">HACKATHON REGISTRATION</p>
      <h1 className="editorial text-5xl leading-[.98] sm:text-6xl">One step closer.<br/><span className="italic text-[#1a56db]">Let’s get you registered.</span></h1>
      <p className="mt-5 mb-10 max-w-xl text-sm leading-6 text-[#697386]">Your pass payment is verified. Complete your participant profile and choose an organizer-published problem statement. We’ll submit your individual hackathon registration automatically.</p>
      <RegistrationWorkflow initialProfile={profile ?? fallbackProfile} problems={problems ?? []} existing={registration ?? null} paymentOrderId={payment.id}/>
    </div>
  </main>;
}
