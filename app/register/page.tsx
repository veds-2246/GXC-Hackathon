import Link from "next/link";
import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RegistrationWorkflow } from "@/components/registration-workflow";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");

  const userId = claims.claims.sub;
  const [{ data: profile }, { data: problems }, { data: registration }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, college, branch, study_year, city, github_url, linkedin_url, tshirt_size, dietary_preference").eq("id", userId).maybeSingle(),
    supabase.from("problem_statements").select("id, title, summary, description, domain, difficulty, tech_hints, sponsor, max_slots, filled_slots").eq("is_active", true).order("display_order"),
    supabase.from("registrations").select("application_number, registration_type, idea_title").eq("created_by", userId).neq("status", "cancelled").maybeSingle(),
  ]);

  const fallbackProfile = {
    full_name: null, phone: null, college: null, branch: null, study_year: null,
    city: null, github_url: null, linkedin_url: null, tshirt_size: null, dietary_preference: null,
  };

  return <main className="min-h-screen bg-[#fafaf7]">
    <header className="border-b border-[#e4e4dd] bg-white"><div className="container-shell flex h-[72px] items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={19}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Registration</span></span></Link><Link href="/dashboard" className="text-xs font-semibold text-[#1a56db]">Dashboard →</Link></div></header>
    <div className="container-shell max-w-[820px] py-12 sm:py-16">
      <p className="eyebrow mb-4">HACKATHON APPLICATION</p>
      <h1 className="editorial text-5xl leading-[.98] sm:text-6xl">Make something<br/><span className="italic text-[#1a56db]">that matters.</span></h1>
      <p className="mt-5 mb-10 max-w-xl text-sm leading-6 text-[#697386]">Complete your participant profile, choose individual or team participation and submit your idea.</p>
      <RegistrationWorkflow initialProfile={profile ?? fallbackProfile} problems={problems ?? []} existing={registration ?? null}/>
    </div>
  </main>;
}
