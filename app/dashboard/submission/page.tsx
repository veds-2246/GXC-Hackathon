import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock, FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveProjectSubmission } from "./actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";

const field = "mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none focus:border-[#5f2295] focus:ring-2 focus:ring-purple-100";
const label = "block text-xs font-semibold text-[#57436d]";

export const dynamic = "force-dynamic";

export default async function ProjectSubmissionPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=/dashboard/submission");
  const [{ data: registration }, { data: window }, { data: problems }] = await Promise.all([
    supabase.from("registrations").select("id,application_number,status").eq("created_by", user.id).eq("status", "confirmed").maybeSingle(),
    supabase.from("project_submission_settings").select("is_open,closes_at").eq("id", 1).maybeSingle(),
    supabase.from("problem_statements").select("id,title").eq("is_active", true).order("display_order"),
  ]);
  if (!registration) redirect("/register");
  const { data: submission } = await supabase.from("project_submissions").select("*").eq("registration_id", registration.id).maybeSingle();
  const params = await searchParams;
  const isOpen = Boolean(window?.is_open && (!window.closes_at || new Date(window.closes_at).getTime() > Date.now()));
  const closeLabel = window?.closes_at ? new Date(window.closes_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : null;
  const errors: Record<string, string> = {
    closed: "The submission window is closed.", registration: "A confirmed registration is required.",
    validation: "Please complete all required fields and enter valid HTTPS links.",
    file: "Upload a PPT or PPTX file up to 15 MB.", upload: "The presentation could not be uploaded. Please try again.",
    save: "Your submission could not be saved. Please try again.",
  };
  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-4"><div className="surface-glass-nav flex items-center justify-between rounded-2xl px-4 py-4 sm:px-6"><Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-[#69408e]"><ArrowLeft size={15}/> Dashboard</Link><span className="text-xs font-bold tracking-wider text-[#5f2295]">GENXCODE · SUBMISSIONS</span></div></header>
    <section className="container-shell max-w-4xl py-10 sm:py-14">
      <p className="eyebrow">SOLO HACKATHON</p><h1 className="editorial mt-3 text-4xl text-[#220749] sm:text-6xl">Project submission.</h1>
      <p className="mt-3 text-sm leading-6 text-[#76678a]">Submit your project details, working production link and presentation. Your submission is linked to application {registration.application_number}.</p>
      {params.saved && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">Your project submission has been saved successfully.</p>}
      {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{errors[params.error] ?? "Something went wrong."}</p>}
      {!isOpen && <div className="mt-8 rounded-2xl border border-[#eadff5] bg-white p-6 sm:p-9"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f4effc] text-[#5f2295]"><Lock size={25}/></div><h2 className="editorial mt-5 text-center text-3xl">Submissions are closed.</h2><p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-[#76678a]">The organizers have not opened the submission window or it has been closed. Please check back later.</p>{submission && <p className="mt-5 text-center text-xs font-semibold text-[#5f2295]">Your previous submission is saved and available to organizers.</p>}</div>}
      {isOpen && <form action={saveProjectSubmission} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-8">
          <p className="eyebrow">01 · PROJECT DETAILS</p><h2 className="editorial mt-2 text-3xl">Tell us about your project.</h2>
          <label className={label + " mt-6"}>Project title *<input required minLength={3} maxLength={120} name="project_title" defaultValue={submission?.project_title ?? ""} className={field} placeholder="Give your project a name"/></label>
          <label className={label + " mt-5"}>Selected problem statement *<select required name="problem_statement_id" defaultValue={submission?.problem_statement_id ?? ""} className={field}><option value="" disabled>Select your problem statement</option>{(problems ?? []).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
          <label className={label + " mt-5"}>Project description *<textarea required minLength={20} maxLength={3000} rows={5} name="description" defaultValue={submission?.description ?? ""} className={field} placeholder="Describe what your project does (20–3000 characters)."/></label>
          <label className={label + " mt-5"}>Proposed solution and key features *<textarea required minLength={10} maxLength={3000} rows={5} name="solution_features" defaultValue={submission?.solution_features ?? ""} className={field} placeholder="Explain your approach and the main features."/></label>
        </section>
        <section className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-8">
          <p className="eyebrow">02 · PROJECT LINKS</p><h2 className="editorial mt-2 text-3xl">Show us what you built.</h2>
          <label className={label + " mt-6"}>GitHub repository URL *<input required type="url" name="github_url" pattern="https://.*" defaultValue={submission?.github_url ?? ""} className={field} placeholder="https://github.com/username/project"/></label>
          <label className={label + " mt-5"}>Live production link *<input required type="url" name="production_url" pattern="https://.*" defaultValue={submission?.production_url ?? ""} className={field} placeholder="https://your-project.vercel.app"/></label>
        </section>
        <section className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-8">
          <p className="eyebrow">03 · PRESENTATION</p><h2 className="editorial mt-2 text-3xl">Upload your PPT.</h2><p className="mt-2 text-sm leading-6 text-[#76678a]">A PPT or PPTX is mandatory. A simple AI-generated presentation is also accepted. Maximum file size: 15 MB.</p>
          <label className={label + " mt-6"}>Project presentation *{submission?.presentation_path && <span className="ml-2 font-normal text-green-700">Current file uploaded</span>}<input type="file" name="presentation" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" required={!submission?.presentation_path} className={field}/></label>
          {submission?.presentation_path && <p className="mt-2 text-xs text-[#8d7ba3]">Choose another file only if you want to replace your existing presentation.</p>}
        </section>
        <section className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-8">
          <p className="eyebrow">04 · DECLARATION</p><label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#57436d]"><input required type="checkbox" name="declaration" className="mt-1 size-4 accent-[#5f2295]"/><span>I confirm that this is my original project and that the GitHub repository, production link and presentation are accessible for evaluation.</span></label>
        </section>
        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><p className="text-xs text-[#8d7ba3]">{closeLabel ? "Submission deadline: " + closeLabel + " (IST)" : "The submission window is controlled by the organizers."}</p><PendingSubmitButton pendingLabel="Uploading & submitting…" className="rounded-full bg-[#5f2295] px-7 py-3.5 text-sm font-semibold text-white"><FileUp size={16}/>{submission ? "Update submission" : "Submit project"}</PendingSubmitButton></div>
      </form>}
      {submission && <div className="mt-6 rounded-2xl bg-[#f4effc] p-5 text-sm text-[#57436d]"><p className="font-semibold">Current review status: <span className="capitalize">{submission.status.replace("_"," ")}</span></p><p className="mt-1 text-xs">Submitted {new Date(submission.submitted_at).toLocaleString("en-IN")}</p></div>}
    </section>
  </main>;
}
