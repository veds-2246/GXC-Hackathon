import Link from "next/link";
import { redirect } from "next/navigation";
import { Code2, LogOut, Save, Plus, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import { saveProblemStatement, saveWorkshopSettings } from "@/app/admin/actions";

const fieldClass = "mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100";
const labelClass = "block text-xs font-semibold text-[#374151]";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const [{ data: workshop }, { data: problems }] = await Promise.all([
    supabase.from("event_workshop_settings").select("title,venue,timing,pre_instructions").eq("id", 1).maybeSingle(),
    supabase.from("problem_statements").select("id,title,summary,description,domain,difficulty,tech_hints,sponsor,max_slots,filled_slots,display_order,is_active").order("display_order"),
  ]);
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <header className="border-b border-[#e4e4dd] bg-white">
        <div className="container-shell flex h-[76px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={21}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Admin</span></span></Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold"><ArrowLeft size={14}/> Website</Link>
            <form action={signOut}><button className="inline-flex items-center gap-2 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold"><LogOut size={14}/> Sign out</button></form>
          </div>
        </div>
      </header>

      <section className="container-shell py-12">
        <p className="eyebrow mb-3">ORGANIZER CONTROL ROOM</p>
        <h1 className="editorial text-5xl sm:text-6xl">Event management.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#697386]">Manage the Day 1 AI workshop invitation and publish the problem statements participants can choose from their dashboards.</p>

        {params.saved && <p role="status" className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Changes saved successfully.</p>}
        {params.error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">We couldn’t save those changes. Check the fields and try again.</p>}

        <section className="mt-8 rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8">
          <div className="mb-6"><p className="eyebrow">DAY 1 · AI WORKSHOP</p><h2 className="editorial mt-2 text-3xl">Workshop invitation</h2><p className="mt-2 text-sm text-[#697386]">These details appear below the account information on every participant dashboard.</p></div>
          <form action={saveWorkshopSettings} className="space-y-5">
            <label className={labelClass}>Venue<input name="venue" defaultValue={workshop?.venue ?? ""} className={fieldClass} placeholder="Enter workshop venue"/></label>
            <label className={labelClass}>Timing<input name="timing" defaultValue={workshop?.timing ?? ""} className={fieldClass} placeholder="e.g. 9:00 AM – 12:30 PM"/></label>
            <label className={labelClass}>Pre-instructions<textarea name="pre_instructions" rows={5} defaultValue={workshop?.pre_instructions ?? ""} className={fieldClass} placeholder="What should participants bring, install or complete before arriving?"/></label>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#1a56db] px-6 py-3 text-sm font-semibold text-white"><Save size={16}/> Save workshop invitation</button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-[#e4e4dd] bg-white p-6 sm:p-8">
          <div className="mb-6"><p className="eyebrow">HACKATHON CONTENT</p><h2 className="editorial mt-2 text-3xl">Problem statements</h2><p className="mt-2 text-sm text-[#697386]">Create, edit or unpublish organizer-defined statements. Only active statements appear in the participant dropdown.</p></div>

          <div className="mb-8 rounded-xl bg-[#f7f8fa] p-5">
            <h3 className="font-semibold">Add a problem statement</h3>
            <form action={saveProblemStatement} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>Title *<input required name="title" className={fieldClass}/></label>
                <label className={labelClass}>Domain<input name="domain" className={fieldClass} placeholder="e.g. Healthcare, Education"/></label>
                <label className={labelClass}>Difficulty<input name="difficulty" className={fieldClass} placeholder="e.g. Beginner, Intermediate"/></label>
                <label className={labelClass}>Sponsor<input name="sponsor" className={fieldClass}/></label>
                <label className={labelClass}>Maximum selections<input name="max_slots" type="number" min="0" className={fieldClass} placeholder="Leave blank for no limit"/></label>
                <label className={labelClass}>Display order<input name="display_order" type="number" defaultValue="0" className={fieldClass}/></label>
              </div>
              <label className={labelClass}>Short summary *<textarea required name="summary" rows={2} className={fieldClass}/></label>
              <label className={labelClass}>Full description<textarea name="description" rows={4} className={fieldClass}/></label>
              <label className={labelClass}>Technology hints<textarea name="tech_hints" rows={2} className={fieldClass}/></label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#374151]"><input type="checkbox" name="is_active" defaultChecked className="size-4 accent-[#1a56db]"/> Publish immediately</label>
              <button className="inline-flex items-center gap-2 rounded-full bg-[#1a56db] px-6 py-3 text-sm font-semibold text-white"><Plus size={16}/> Add problem statement</button>
            </form>
          </div>

          <div className="space-y-5">
            {(problems ?? []).map((problem) => (
              <form key={problem.id} action={saveProblemStatement} className="rounded-xl border border-[#e4e4dd] p-5">
                <input type="hidden" name="id" value={problem.id}/>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{problem.title}</h3>
                  <span className={problem.is_active ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-[#f1f2f4] px-3 py-1 text-xs font-semibold text-[#697386]"}>{problem.is_active ? "Published" : "Unpublished"} · {problem.filled_slots} selected</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Title *<input required name="title" defaultValue={problem.title} className={fieldClass}/></label>
                  <label className={labelClass}>Domain<input name="domain" defaultValue={problem.domain ?? ""} className={fieldClass}/></label>
                  <label className={labelClass}>Difficulty<input name="difficulty" defaultValue={problem.difficulty ?? ""} className={fieldClass}/></label>
                  <label className={labelClass}>Sponsor<input name="sponsor" defaultValue={problem.sponsor ?? ""} className={fieldClass}/></label>
                  <label className={labelClass}>Maximum selections<input name="max_slots" type="number" min="0" defaultValue={problem.max_slots ?? ""} className={fieldClass}/></label>
                  <label className={labelClass}>Display order<input name="display_order" type="number" defaultValue={problem.display_order} className={fieldClass}/></label>
                </div>
                <label className={labelClass + " mt-4"}>Short summary *<textarea required name="summary" rows={2} defaultValue={problem.summary} className={fieldClass}/></label>
                <label className={labelClass + " mt-4"}>Full description<textarea name="description" rows={3} defaultValue={problem.description ?? ""} className={fieldClass}/></label>
                <label className={labelClass + " mt-4"}>Technology hints<textarea name="tech_hints" rows={2} defaultValue={problem.tech_hints ?? ""} className={fieldClass}/></label>
                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[#374151]"><input type="checkbox" name="is_active" defaultChecked={problem.is_active} className="size-4 accent-[#1a56db]"/> Published and visible to participants</label>
                <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#1a56db] px-5 py-2.5 text-sm font-semibold text-[#1a56db]"><Save size={15}/> Save changes</button>
              </form>
            ))}
            {(!problems || problems.length === 0) && <p className="rounded-xl bg-[#f7f8fa] p-5 text-sm text-[#697386]">No problem statements have been added yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
