import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText, Lock, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import { reviewSubmission, updateSubmissionWindow } from "./actions";

const field = "mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#5f2295]";
const label = "block text-xs font-semibold text-[#57436d]";
const statuses = ["pending","under_review","shortlisted","rejected","winner"];

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}) {
  const supabase = await createClient();
  const {data:{user},error} = await supabase.auth.getUser();
  if(error || !user) redirect("/login?next=/admin/submissions");
  const {data:profile} = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role !== "admin") redirect("/");
  const [{data:window},{data:submissions}] = await Promise.all([
    supabase.from("project_submission_settings").select("*").eq("id",1).maybeSingle(),
    supabase.from("project_submissions").select("*").order("submitted_at",{ascending:false}),
  ]);
  const rows = submissions ?? [];
  const registrationIds = rows.map(s=>s.registration_id);
  const problemIds = [...new Set(rows.map(s=>s.problem_statement_id))];
  const [{data:registrations},{data:problems}] = await Promise.all([
    registrationIds.length ? supabase.from("registrations").select("id,name,email,application_number").in("id",registrationIds) : Promise.resolve({data:[]}),
    problemIds.length ? supabase.from("problem_statements").select("id,title").in("id",problemIds) : Promise.resolve({data:[]}),
  ]);
  const registrationMap = new Map((registrations ?? []).map(r=>[r.id,r]));
  const problemMap = new Map((problems ?? []).map(p=>[p.id,p.title]));
  const closeValue = window?.closes_at ? new Date(new Date(window.closes_at).getTime() + 330*60000).toISOString().slice(0,16) : "";
  const effectiveOpen = Boolean(window?.is_open && (!window.closes_at || new Date(window.closes_at).getTime() > Date.now()));
  const signed = await Promise.all(rows.map(s=>supabase.storage.from("project-presentations").createSignedUrl(s.presentation_path,600)));
  const params = await searchParams;
  const counts = {total:rows.length,pending:rows.filter(s=>s.status==="pending").length,shortlisted:rows.filter(s=>s.status==="shortlisted").length,winners:rows.filter(s=>s.status==="winner").length};
  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-4"><div className="surface-glass-nav flex items-center justify-between rounded-2xl px-4 py-4 sm:px-6"><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#69408e]"><ArrowLeft size={15}/> Admin panel</Link><form action={signOut}><button className="text-xs font-semibold">Sign out</button></form></div></header>
    <section className="container-shell py-10">
      <p className="eyebrow">ORGANIZER CONTROL ROOM</p><h1 className="editorial mt-3 text-4xl text-[#220749] sm:text-6xl">Project submissions.</h1><p className="mt-3 text-sm text-[#76678a]">Control the submission window and review every solo project.</p>
      {params.saved && <p role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800">Changes saved successfully.</p>}
      {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Could not save changes. Check the fields and try again.</p>}
      <section className="mt-7 rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3"><span className={effectiveOpen?"grid size-11 place-items-center rounded-xl bg-green-50 text-green-700":"grid size-11 place-items-center rounded-xl bg-[#f4effc] text-[#5f2295]"}>{effectiveOpen?<Unlock size={21}/>:<Lock size={21}/>}</span><div><p className="eyebrow">SUBMISSION WINDOW</p><h2 className="editorial mt-1 text-2xl">{effectiveOpen?"Submissions are open":"Submissions are locked"}</h2></div></div>
        <form action={updateSubmissionWindow} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="flex items-center gap-3 rounded-xl bg-[#f8f3ff] p-4 text-sm font-semibold text-[#57436d]"><input type="checkbox" name="is_open" defaultChecked={effectiveOpen} className="size-4 accent-[#5f2295]"/> Open submissions</label>
          <label className={label}>Optional closing date and time (IST)<input type="datetime-local" name="closes_at" defaultValue={closeValue} className={field}/></label>
          <button className="rounded-full bg-[#5f2295] px-6 py-3 text-sm font-semibold text-white">Save window</button>
        </form>
        <p className="mt-3 text-xs text-[#8d7ba3]">The window is closed by default. A passed deadline locks submissions. Reopening requires an admin to turn this switch on and save again.</p>
      </section>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Total",counts.total],["Pending",counts.pending],["Shortlisted",counts.shortlisted],["Winners",counts.winners]].map(([k,v])=><div key={k} className="rounded-xl border border-[#eadff5] bg-white p-4"><p className="text-xs text-[#8d7ba3]">{k}</p><p className="editorial mt-1 text-3xl">{v}</p></div>)}</div>
      <div className="mt-8 space-y-5">
        {rows.map((s,index)=>{
          const reg = registrationMap.get(s.registration_id);
          const signedUrl = signed[index]?.data?.signedUrl;
          return <article key={s.id} className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{reg?.application_number ?? "APPLICATION"}</p><h2 className="editorial mt-2 text-2xl">{s.project_title}</h2><p className="mt-1 text-xs text-[#8d7ba3]">{reg?.name ?? "Student"} · {reg?.email ?? ""}</p></div><span className="rounded-full bg-[#f4effc] px-3 py-1.5 text-xs font-semibold capitalize text-[#5f2295]">{s.status.replace("_"," ")}</span></div>
            <p className="mt-4 text-sm font-semibold text-[#57436d]">Problem statement: {problemMap.get(s.problem_statement_id) ?? "Unavailable"}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#76678a]">{s.description}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#57436d]">{s.solution_features}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold"><a className="inline-flex items-center gap-1 text-[#5f2295]" href={s.github_url} target="_blank" rel="noreferrer">GitHub <ExternalLink size={13}/></a><a className="inline-flex items-center gap-1 text-[#5f2295]" href={s.production_url} target="_blank" rel="noreferrer">Production <ExternalLink size={13}/></a>{signedUrl && <a className="inline-flex items-center gap-1 text-[#5f2295]" href={signedUrl} target="_blank" rel="noreferrer"><FileText size={13}/> Download PPT</a>}</div>
            <form action={reviewSubmission} className="mt-6 grid gap-3 rounded-xl bg-[#f8f3ff] p-4 sm:grid-cols-3">
              <input type="hidden" name="id" value={s.id}/>
              <label className={label}>Review status<select name="status" defaultValue={s.status} className={field}>{statuses.map(st=><option key={st} value={st}>{st.replace("_"," ")}</option>)}</select></label>
              <label className={label}>Score / 100<input name="score" type="number" min="0" max="100" step="0.01" defaultValue={s.score ?? ""} className={field}/></label>
              <label className={label+" sm:col-span-3"}>Private judge remarks<textarea name="judge_remarks" rows={2} defaultValue={s.judge_remarks ?? ""} className={field}/></label>
              <div className="sm:col-span-3"><button className="rounded-full border border-[#5f2295] px-5 py-2.5 text-xs font-semibold text-[#5f2295]">Save review</button></div>
            </form>
            <p className="mt-3 text-[11px] text-[#9a8ba9]">Submitted {new Date(s.submitted_at).toLocaleString("en-IN")}</p>
          </article>;
        })}
        {rows.length===0 && <div className="rounded-2xl border border-[#eadff5] bg-white p-10 text-center text-sm text-[#8d7ba3]">No project submissions yet. The submission window is {effectiveOpen?"open":"closed"}.</div>}
      </div>
    </section>
  </main>;
}
