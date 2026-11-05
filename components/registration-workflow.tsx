"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = { full_name:string|null; phone:string|null; college:string|null; branch:string|null; study_year:string|null; city:string|null; github_url:string|null; linkedin_url:string|null };
type Problem = { id:string; title:string; summary:string; domain:string|null; difficulty:string|null; max_slots:number|null; filled_slots:number };
type ExistingRegistration = { application_number:string|null };
const fieldClass="mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100";

export function RegistrationWorkflow({initialProfile,problems,existing}:{initialProfile:Profile;problems:Problem[];existing:ExistingRegistration|null}) {
 const supabase=createClient(); const router=useRouter();
 const [profile,setProfile]=useState<Profile>(initialProfile); const [problemId,setProblemId]=useState(problems[0]?.id??"");
 const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const [application,setApplication]=useState<string|null>(null);
 function update<K extends keyof Profile>(key:K,value:Profile[K]){setProfile(current=>({...current,[key]:value}));}
 const profileComplete=Boolean(profile.full_name?.trim()&&profile.phone?.trim()&&profile.college?.trim()&&profile.branch?.trim()&&profile.study_year?.trim());
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setSaving(true);setError("");
  const {data:auth}=await supabase.auth.getUser();
  if(!auth.user){setSaving(false);setError("Your session expired. Please sign in again.");return;}
  const {error:profileError}=await supabase.from("profiles").update({...profile,updated_at:new Date().toISOString()}).eq("id",auth.user.id);
  if(profileError){setSaving(false);setError(profileError.message);return;}
  const {data,error:registrationError}=await supabase.rpc("submit_hackathon_registration",{p_problem_statement_id:problemId});
  setSaving(false);
  if(registrationError){setError(registrationError.message);return;}
  const result=Array.isArray(data)?data[0]:data;
  if(!result?.application_number){setError("Application submitted but the application number could not be retrieved. Refresh the page.");return;}
  setApplication(result.application_number);router.refresh();
 }
 const applicationNumber=application??existing?.application_number;
 if(applicationNumber)return <section className="rounded-2xl border border-[#cfe7d5] bg-white p-7"><div className="flex items-center gap-3 text-[#1e8e3e]"><CheckCircle2 size={22}/><p className="text-sm font-bold">Hackathon application submitted</p></div><p className="editorial mt-5 text-4xl">{applicationNumber}</p><p className="mt-3 text-sm leading-6 text-[#697386]">Your application number has been generated. Continue with the mandatory Prompt Wars registration and payment steps from your dashboard.</p><button onClick={()=>router.push("/dashboard")} className="mt-7 rounded-full bg-[#1a56db] px-6 py-3 text-sm font-semibold text-white">Go to dashboard</button></section>;
 return <form onSubmit={submit} className="space-y-8">
  <section className="rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8"><div className="mb-6"><p className="eyebrow">PARTICIPANT PROFILE</p><h2 className="editorial mt-2 text-3xl">Your details</h2><p className="mt-2 text-sm text-[#697386]">Complete your profile to continue with hackathon registration.</p></div><div className="grid gap-4 sm:grid-cols-2">
   <label className="text-xs font-semibold text-[#374151]">Full name *<input required value={profile.full_name??""} onChange={e=>update("full_name",e.target.value)} className={fieldClass}/></label>
   <label className="text-xs font-semibold text-[#374151]">Phone number *<input required type="tel" value={profile.phone??""} onChange={e=>update("phone",e.target.value)} className={fieldClass} placeholder="+91"/></label>
   <label className="text-xs font-semibold text-[#374151]">College / Institution *<input required value={profile.college??""} onChange={e=>update("college",e.target.value)} className={fieldClass}/></label>
   <label className="text-xs font-semibold text-[#374151]">Branch / Department *<input required value={profile.branch??""} onChange={e=>update("branch",e.target.value)} className={fieldClass}/></label>
   <label className="text-xs font-semibold text-[#374151]">Year of study *<select required value={profile.study_year??""} onChange={e=>update("study_year",e.target.value)} className={fieldClass}><option value="">Select year</option>{["1st Year","2nd Year","3rd Year","4th Year","Postgraduate","Other"].map(v=><option key={v}>{v}</option>)}</select></label>
   <label className="text-xs font-semibold text-[#374151]">City<input value={profile.city??""} onChange={e=>update("city",e.target.value)} className={fieldClass}/></label>
   <label className="text-xs font-semibold text-[#374151]">GitHub profile<input type="url" value={profile.github_url??""} onChange={e=>update("github_url",e.target.value)} className={fieldClass} placeholder="https://github.com/..."/></label>
   <label className="text-xs font-semibold text-[#374151]">LinkedIn profile<input type="url" value={profile.linkedin_url??""} onChange={e=>update("linkedin_url",e.target.value)} className={fieldClass} placeholder="https://linkedin.com/in/..."/></label>
  </div>{!profileComplete&&<p className="mt-4 text-xs text-[#a16207]">Required fields: name, phone, college, branch and year of study.</p>}</section>
  <section className="rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8"><div className="mb-6"><p className="eyebrow">HACKATHON REGISTRATION</p><h2 className="editorial mt-2 text-3xl">Select a problem statement</h2><p className="mt-2 text-sm text-[#697386]">Choose one of the problem statements published by the organizers.</p></div>
   {problems.length===0?<p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Problem statements have not been published yet. Registration will be available once the organizers publish them.</p>:<><label className="block text-xs font-semibold text-[#374151]">Problem statement *<select required value={problemId} onChange={e=>setProblemId(e.target.value)} className={fieldClass}><option value="">Choose a problem statement</option>{problems.map(p=><option key={p.id} value={p.id} disabled={p.max_slots!==null&&p.filled_slots>=p.max_slots}>{p.title}{p.max_slots!==null?` · ${Math.max(0,p.max_slots-p.filled_slots)} slots left`:""}</option>)}</select></label>{problems.find(p=>p.id===problemId)&&<div className="mt-4 rounded-xl bg-[#f6f7fa] p-4"><p className="text-sm font-semibold">{problems.find(p=>p.id===problemId)?.title}</p><p className="mt-1 text-xs leading-5 text-[#697386]">{problems.find(p=>p.id===problemId)?.summary}</p></div>}</>}
  </section>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  <button type="submit" disabled={saving||!profileComplete||problems.length===0||!problemId} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a56db] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1649bd] disabled:cursor-not-allowed disabled:opacity-50">{saving?<><LoaderCircle className="animate-spin" size={17}/>Saving…</>:<>Submit hackathon registration <ChevronRight size={17}/></>}</button>
 </form>;
}