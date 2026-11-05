"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Copy, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  college: string | null;
  branch: string | null;
  study_year: string | null;
  city: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  tshirt_size: string | null;
  dietary_preference: string | null;
};

type Problem = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  domain: string | null;
  difficulty: string | null;
  tech_hints: string | null;
  sponsor: string | null;
  max_slots: number | null;
  filled_slots: number;
};

type ExistingRegistration = { application_number: string | null; registration_type: string; idea_title: string | null };

const fieldClass = "mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100";

export function RegistrationWorkflow({ initialProfile, problems, existing }: {
  initialProfile: Profile;
  problems: Problem[];
  existing: ExistingRegistration | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [type, setType] = useState<"individual" | "team">("individual");
  const [teamName, setTeamName] = useState("");
  const [problemId, setProblemId] = useState(problems[0]?.id ?? "");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaSummary, setIdeaSummary] = useState("");
  const [techStack, setTechStack] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ application: string; invite: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(current => ({ ...current, [key]: value }));
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSavingProfile(false);
      setError("Your session expired. Please sign in again.");
      return false;
    }
    const { error: updateError } = await supabase.from("profiles").update({
      ...profile,
      updated_at: new Date().toISOString(),
    }).eq("id", auth.user.id);
    setSavingProfile(false);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setSubmitting(true);
    const saved = await saveProfile();
    if (!saved) {
      setSubmitting(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("submit_hackathon_registration", {
      p_registration_type: type,
      p_problem_statement_id: problemId,
      p_idea_title: ideaTitle,
      p_idea_summary: ideaSummary,
      p_tech_stack: techStack,
      p_team_name: type === "team" ? teamName : null,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.application_number) {
      setError("Registration was submitted but the application number could not be read. Refresh your dashboard.");
      return;
    }
    setSuccess({ application: result.application_number, invite: result.team_invite_code || null });
    router.refresh();
  }

  const profileComplete = Boolean(profile.full_name?.trim() && profile.phone?.trim() && profile.college?.trim() && profile.branch?.trim() && profile.study_year?.trim());

  if (existing) {
    return <section className="rounded-2xl border border-[#cfe7d5] bg-white p-7">
      <div className="flex items-center gap-3 text-[#1e8e3e]"><CheckCircle2 size={22}/><p className="text-sm font-bold">Hackathon application submitted</p></div>
      <p className="editorial mt-5 text-4xl">{existing.application_number ?? "Application received"}</p>
      <p className="mt-2 text-sm text-[#697386]">{existing.idea_title ?? "Your idea"} · {existing.registration_type === "team" ? "Team" : "Individual"} registration</p>
      <p className="mt-5 text-sm leading-6 text-[#697386]">Keep this application number safe. Your next steps are Prompt Wars verification and payment.</p>
    </section>;
  }

  if (success) {
    return <section className="rounded-2xl border border-[#cfe7d5] bg-white p-7">
      <div className="flex items-center gap-3 text-[#1e8e3e]"><CheckCircle2 size={22}/><p className="text-sm font-bold">Application submitted successfully!</p></div>
      <p className="editorial mt-5 text-4xl">{success.application}</p>
      <p className="mt-2 text-sm text-[#697386]">Save this application number for future reference.</p>
      {success.invite && <div className="mt-6 rounded-xl bg-[#f4f6fb] p-4"><p className="text-xs font-bold text-[#697386]">TEAM INVITE CODE</p><div className="mt-2 flex items-center justify-between gap-3"><code className="text-lg font-bold tracking-widest">{success.invite}</code><button type="button" onClick={() => { void navigator.clipboard.writeText(success.invite!); setCopied(true); }} className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a56db]"><Copy size={14}/>{copied ? "Copied" : "Copy"}</button></div><p className="mt-2 text-xs text-[#697386]">Share this code with your teammates. Team member joining will be enabled in the next step.</p></div>}
      <button onClick={() => router.push("/dashboard")} className="mt-7 rounded-full bg-[#1a56db] px-6 py-3 text-sm font-semibold text-white">Go to dashboard</button>
    </section>;
  }

  return <form onSubmit={submit} className="space-y-8">
    <section className="rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8">
      <div className="mb-6"><p className="eyebrow">STEP 01</p><h2 className="editorial mt-2 text-3xl">Your participant profile</h2><p className="mt-2 text-sm text-[#697386]">Complete the required details before applying.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#374151]">Full name *<input required value={profile.full_name ?? ""} onChange={e=>update("full_name",e.target.value)} className={fieldClass}/></label>
        <label className="text-xs font-semibold text-[#374151]">Phone number *<input required type="tel" value={profile.phone ?? ""} onChange={e=>update("phone",e.target.value)} className={fieldClass} placeholder="+91"/></label>
        <label className="text-xs font-semibold text-[#374151]">College / Institution *<input required value={profile.college ?? ""} onChange={e=>update("college",e.target.value)} className={fieldClass}/></label>
        <label className="text-xs font-semibold text-[#374151]">Branch / Department *<input required value={profile.branch ?? ""} onChange={e=>update("branch",e.target.value)} className={fieldClass}/></label>
        <label className="text-xs font-semibold text-[#374151]">Year of study *<select required value={profile.study_year ?? ""} onChange={e=>update("study_year",e.target.value)} className={fieldClass}><option value="">Select year</option>{["1st Year","2nd Year","3rd Year","4th Year","Postgraduate","Other"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#374151]">City<input value={profile.city ?? ""} onChange={e=>update("city",e.target.value)} className={fieldClass}/></label>
        <label className="text-xs font-semibold text-[#374151]">GitHub profile<input type="url" value={profile.github_url ?? ""} onChange={e=>update("github_url",e.target.value)} className={fieldClass} placeholder="https://github.com/..."/></label>
        <label className="text-xs font-semibold text-[#374151]">LinkedIn profile<input type="url" value={profile.linkedin_url ?? ""} onChange={e=>update("linkedin_url",e.target.value)} className={fieldClass} placeholder="https://linkedin.com/in/..."/></label>
        <label className="text-xs font-semibold text-[#374151]">T-shirt size<select value={profile.tshirt_size ?? ""} onChange={e=>update("tshirt_size",e.target.value)} className={fieldClass}><option value="">Select size</option>{["XS","S","M","L","XL","XXL"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#374151]">Dietary preference<select value={profile.dietary_preference ?? ""} onChange={e=>update("dietary_preference",e.target.value)} className={fieldClass}><option value="">Select preference</option>{["No preference","Vegetarian","Vegan","Jain","Other"].map(v=><option key={v}>{v}</option>)}</select></label>
      </div>
      {!profileComplete && <p className="mt-4 text-xs text-[#a16207]">Required: name, phone, college, branch and year of study.</p>}
    </section>

    <section className="rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8">
      <div className="mb-6"><p className="eyebrow">STEP 02</p><h2 className="editorial mt-2 text-3xl">Choose how you’ll participate</h2></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["individual","team"] as const).map(value=><button key={value} type="button" onClick={()=>setType(value)} className={`rounded-xl border p-4 text-left transition ${type===value?"border-[#1a56db] bg-blue-50/70":"border-[#e4e4dd] hover:border-[#b8c8e8]"}`}><span className="block text-sm font-bold capitalize">{value}</span><span className="mt-1 block text-xs text-[#697386]">{value==="individual"?"I’m participating solo.":"I’m registering a team as its leader."}</span></button>)}
      </div>
      {type==="team" && <label className="mt-5 block text-xs font-semibold text-[#374151]">Team name *<input required value={teamName} onChange={e=>setTeamName(e.target.value)} className={fieldClass} placeholder="Enter a unique team name"/></label>}
      {type==="team" && <p className="mt-2 text-xs text-[#697386]">The team leader is registered first. Team member invitations and the configurable 1–4 member limit will be completed in the team management step.</p>}
    </section>

    <section className="rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8">
      <div className="mb-6"><p className="eyebrow">STEP 03</p><h2 className="editorial mt-2 text-3xl">Your idea</h2><p className="mt-2 text-sm text-[#697386]">Select one active problem statement and tell us what you plan to build.</p></div>
      {problems.length===0 ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No problem statements have been published yet. Please check back after the organizers publish them.</p> : <>
        <label className="block text-xs font-semibold text-[#374151]">Problem statement *<select required value={problemId} onChange={e=>setProblemId(e.target.value)} className={fieldClass}><option value="">Choose a problem</option>{problems.map(p=><option key={p.id} value={p.id}>{p.title}{p.max_slots!==null? ` · ${Math.max(0,p.max_slots-p.filled_slots)} slots left`:""}</option>)}</select></label>
        {problems.find(p=>p.id===problemId) && <div className="mt-3 rounded-xl bg-[#f6f7fa] p-4"><p className="text-sm font-semibold">{problems.find(p=>p.id===problemId)?.title}</p><p className="mt-1 text-xs leading-5 text-[#697386]">{problems.find(p=>p.id===problemId)?.summary}</p></div>}
      </>}
      <label className="mt-5 block text-xs font-semibold text-[#374151]">Idea title *<input required minLength={5} value={ideaTitle} onChange={e=>setIdeaTitle(e.target.value)} className={fieldClass} placeholder="Give your solution a clear title"/></label>
      <label className="mt-5 block text-xs font-semibold text-[#374151]">Idea abstract / summary *<textarea required minLength={30} rows={5} value={ideaSummary} onChange={e=>setIdeaSummary(e.target.value)} className={fieldClass} placeholder="What problem will you solve and how will your solution work?"/></label>
      <label className="mt-5 block text-xs font-semibold text-[#374151]">Planned tech stack<input value={techStack} onChange={e=>setTechStack(e.target.value)} className={fieldClass} placeholder="e.g. Next.js, Python, Supabase"/></label>
    </section>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={submitting || savingProfile || !profileComplete || problems.length===0 || !problemId} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a56db] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1649bd] disabled:cursor-not-allowed disabled:opacity-50">
      {submitting || savingProfile ? <><LoaderCircle className="animate-spin" size={17}/>Submitting application…</> : <>Submit hackathon application <ChevronRight size={17}/></>}
    </button>
    <p className="text-center text-xs leading-5 text-[#8a93a1]">Submitting creates your application number. Payment and Prompt Wars verification are separate steps and will be shown on your dashboard.</p>
  </form>;
}
