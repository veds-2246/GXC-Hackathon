import Link from "next/link";
import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RegistrationWorkflow } from "@/components/registration-workflow";

type RegistrationProfile = {
  full_name: string | null;
  phone: string | null;
  college: string | null;
  branch: string | null;
  study_year: string | null;
  city: string | null;
  github_url: string | null;
  linkedin_url: string | null;
};

const fallbackProfile: RegistrationProfile = {
  full_name: null,
  phone: null,
  college: null,
  branch: null,
  study_year: null,
  city: null,
  github_url: null,
  linkedin_url: null,
};

export default async function RegisterPage() {
  const localDevBypass = process.env.LOCAL_DEV_BYPASS === "true";

  let initialProfile: RegistrationProfile = fallbackProfile;
  let existingRegistration: { application_number: string | null } | null = null;
  let paymentOrderId: string | undefined;

  if (!localDevBypass) {
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

    initialProfile = profile ?? fallbackProfile;
    existingRegistration = registration;
    paymentOrderId = payment.id;
  }

  return <main className="min-h-screen bg-[#fafaf7]">
    <header className="border-b border-[#e4e4dd] bg-white"><div className="container-shell flex h-[72px] items-center justify-between">
      <Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={19}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Registration</span></span></Link>
      <span className={localDevBypass ? "text-xs font-semibold text-[#b77900]" : "text-xs font-semibold text-[#1e8e3e]"}>
        {localDevBypass ? "Local testing mode" : "Payment verified"}
      </span>
    </div></header>
    <div className="container-shell mx-auto max-w-[820px] py-12 sm:py-16">
      <p className="eyebrow mb-4">HACKATHON REGISTRATION</p>
      <h1 className="editorial text-5xl leading-[.98] sm:text-6xl">One step closer.<br/><span className="italic text-[#1a56db]">Let’s get you registered.</span></h1>
      <p className="mt-5 mb-10 max-w-xl text-sm leading-6 text-[#697386]">
        {localDevBypass
          ? "Local testing is enabled. Authentication and payment are temporarily bypassed so you can test the participant registration form."
          : "Your pass payment is verified. Complete your participant profile. We’ll submit your individual hackathon registration automatically."}
      </p>
      <RegistrationWorkflow
        initialProfile={initialProfile}
        existing={existingRegistration}
        paymentOrderId={paymentOrderId}
        localPreview={localDevBypass}
      />
    </div>
  </main>;
}
