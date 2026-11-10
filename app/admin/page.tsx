import { BrandLockup } from "@/components/brand-lockup";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Save, Plus, CalendarDays, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import {
  deleteEventDetail, deleteProblemStatement, saveEventDayCount, saveEventDetail, saveProblemStatement, saveWhatsappChannelLink,
} from "@/app/admin/actions";
import { AdminDeleteButton } from "@/components/admin-delete-button";

const fieldClass = "mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5f2295] focus:ring-2 focus:ring-purple-100";
const labelClass = "block text-xs font-semibold text-[#57436d]";
const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const [{ data: scheduleSettings }, { data: events }, { data: problems }] = await Promise.all([
    supabase.from("event_schedule_settings").select("day_count,whatsapp_channel_url").eq("id", 1).maybeSingle(),
    supabase.from("event_details").select("id,day_number,title,venue,timing,pre_instructions,is_published,created_at").order("day_number").order("created_at"),
    supabase.from("problem_statements").select("id,title,summary,description,domain,difficulty,tech_hints,sponsor,max_slots,filled_slots,display_order,is_active").order("display_order"),
  ]);
  const dayCount = scheduleSettings?.day_count ?? 1;
  const params = await searchParams;
  const savedMessages: Record<string, string> = {
    "day-count": "Event day count saved.", "event-detail": "Event details saved.", "whatsapp-channel": "WhatsApp Channel link saved.",
    "event-delete": "Event entry deleted.", problem: "Problem statement saved.",
    "problem-delete": "Problem statement deleted.",
  };
  const errorMessages: Record<string, string> = {
    "days-in-use": "The day count cannot be reduced because event entries already exist on later days. Move or delete those entries first.",
    "day-count": "Could not update the day count. Choose a valid number of days.", "whatsapp-channel": "Enter a valid WhatsApp Channel URL beginning with https://whatsapp.com/channel/.",
    "event-detail": "Could not save this event. Check its title and selected day.",
    "event-delete": "Could not delete this event. Please try again.",
    "problem-in-use": "This problem statement has participant selections. Unpublish it instead so existing participant records remain intact.",
    "problem-delete": "The problem statement could not be deleted. It may already be in use.",
    problem: "Could not save the problem statement. Check the required fields.",
  };

  return (
    <main className="min-h-screen bg-[#fcfaff]">
      <header className="container-shell pt-3"><div className="surface-glass-nav flex min-h-[68px] flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 sm:min-h-[76px] sm:flex-nowrap sm:px-6">
        <BrandLockup />
        <div className="flex flex-wrap items-center justify-end gap-2"><Link href="/admin/submissions" className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-[#f4effc] px-3 py-2.5 text-[11px] font-semibold text-[#5f2295] sm:px-4 sm:text-xs">Submissions</Link><Link href="/admin/operations" className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-[#f4effc] px-3 py-2.5 text-[11px] font-semibold text-[#5f2295] sm:px-4 sm:text-xs">Event operations</Link><Link href="/" className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full border border-[#eadff5] px-3 py-2.5 text-[11px] font-semibold sm:px-4 sm:text-xs">Website</Link><form action={signOut}><button className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-[#eadff5] px-3 py-2.5 text-[11px] font-semibold sm:px-4 sm:text-xs"><LogOut size={14}/> Sign out</button></form></div>
      </div></header>

      <section className="container-shell py-12">
        <p className="eyebrow mb-3">ORGANIZER CONTROL ROOM</p>
        <h1 className="editorial text-4xl leading-tight sm:text-6xl">Event management.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#76678a]">Choose the event duration and create event entries for each day. Participants see published details grouped by day on their dashboards.</p>
        {params.saved && <p role="status" className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{savedMessages[params.saved] ?? "Changes saved successfully."}</p>}
        {params.error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessages[params.error] ?? "Something went wrong. Check the fields and try again."}</p>}

        <section className="admin-section card-hover reveal-on-scroll mt-6 rounded-2xl border border-[#eadff5] bg-white/85 p-4 sm:mt-8 sm:p-8">
          <div className="mb-6 flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f4effc] text-[#5f2295]"><CalendarDays size={21}/></span><div><p className="eyebrow">EVENT CONFIGURATION</p><h2 className="editorial mt-2 text-3xl">Event schedule</h2><p className="mt-2 text-sm text-[#76678a]">Choose how many days the event runs. You can add multiple entries under each day.</p></div></div>
          <form action={saveEventDayCount} className="flex flex-col gap-4 rounded-xl bg-[#f8f3ff] p-4 sm:p-5 sm:flex-row sm:items-end">
            <label className={labelClass + " flex-1"}>Number of event days
              <select name="day_count" defaultValue={String(dayCount)} className={fieldClass}>{dayOptions.map((day) => <option key={day} value={day}>{day} {day === 1 ? "day" : "days"}</option>)}</select>
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5f2295] px-6 py-3 text-sm font-semibold text-white"><Save size={16}/> Save day count</button>
          </form>
          <p className="mt-3 text-xs text-[#8d7ba3]">Current schedule: {dayCount} {dayCount === 1 ? "day" : "days"}. You cannot reduce the count below a day that already contains an event entry.</p>
        </section>

        <section className="admin-section card-hover reveal-on-scroll mt-6 rounded-2xl border border-[#eadff5] bg-white/85 p-4 sm:mt-8 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f8ee] text-[#168a45]"><MessageCircle size={21}/></span>
            <div><p className="eyebrow">COMMUNITY & ANNOUNCEMENTS</p><h2 className="editorial mt-2 text-3xl">WhatsApp Channel</h2><p className="mt-2 text-sm text-[#76678a]">Add the official channel link. A floating Join button will appear on participant dashboards only after a link is saved.</p></div>
          </div>
          <form action={saveWhatsappChannelLink} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className={labelClass + " flex-1"}>WhatsApp Channel URL
              <input name="whatsapp_channel_url" type="url" defaultValue={scheduleSettings?.whatsapp_channel_url ?? ""} className={fieldClass} placeholder="https://whatsapp.com/channel/..." />
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#168a45] px-6 py-3 text-sm font-semibold text-white"><Save size={16}/> Save channel link</button>
          </form>
          <p className="mt-3 text-xs text-[#8d7ba3]">Leave the field empty and save to hide the floating button. Only WhatsApp Channel links are accepted.</p>
        </section>
        <section className="admin-section card-hover reveal-on-scroll mt-6 rounded-2xl border border-[#eadff5] bg-white/85 p-4 sm:mt-8 sm:p-8">
          <div className="mb-6"><p className="eyebrow">EVENT DETAILS</p><h2 className="editorial mt-2 text-3xl">Add an event entry</h2><p className="mt-2 text-sm text-[#76678a]">Event titles are fully editable. Add one or more entries under any configured day.</p></div>
          <form action={saveEventDetail} className="space-y-4 rounded-xl bg-[#f8f3ff] p-4 sm:p-5">
            <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
              <label className={labelClass + " min-w-0"}>Day
                <select name="day_number" required defaultValue="1" className={fieldClass}>{dayOptions.slice(0, dayCount).map((day) => <option key={day} value={day}>Day {day}</option>)}</select>
              </label>
              <label className={labelClass + " min-w-0"}>Event title *<input required name="title" className={fieldClass} placeholder="Enter event name"/></label>
              <label className={labelClass + " min-w-0"}>Venue<input name="venue" className={fieldClass} placeholder="Enter venue or location"/></label>
              <label className={labelClass + " min-w-0"}>Timing<input name="timing" className={fieldClass} placeholder="Enter date and time"/></label>
            </div>
            <label className={labelClass + " min-w-0"}>Pre-instructions<textarea name="pre_instructions" rows={4} className={fieldClass} placeholder="Add instructions participants should know before arriving."/></label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#57436d]"><input type="checkbox" name="is_published" defaultChecked className="size-4 accent-[#5f2295]"/> Publish on participant dashboards</label>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#5f2295] px-6 py-3 text-sm font-semibold text-white"><Plus size={16}/> Add event details</button>
          </form>

          <div className="mt-8 space-y-5">
            {(events ?? []).map((event) => (
              <article key={event.id} className="card-hover min-w-0 rounded-xl border border-[#eadff5] bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">DAY {event.day_number}</p><h3 className="mt-1 font-semibold">{event.title}</h3></div><span className={event.is_published ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-[#f1f2f4] px-3 py-1 text-xs font-semibold text-[#76678a]"}>{event.is_published ? "Published" : "Draft"}</span></div>
                <form action={saveEventDetail} className="space-y-4">
                  <input type="hidden" name="id" value={event.id}/>
                  <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
                    <label className={labelClass + " min-w-0"}>Day<select name="day_number" defaultValue={String(event.day_number)} className={fieldClass}>{dayOptions.slice(0, dayCount).map((day) => <option key={day} value={day}>Day {day}</option>)}</select></label>
                    <label className={labelClass + " min-w-0"}>Event title *<input required name="title" defaultValue={event.title} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Venue<input name="venue" defaultValue={event.venue ?? ""} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Timing<input name="timing" defaultValue={event.timing ?? ""} className={fieldClass}/></label>
                  </div>
                  <label className={labelClass + " min-w-0"}>Pre-instructions<textarea name="pre_instructions" rows={3} defaultValue={event.pre_instructions ?? ""} className={fieldClass}/></label>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#57436d]"><input type="checkbox" name="is_published" defaultChecked={event.is_published} className="size-4 accent-[#5f2295]"/> Published on participant dashboards</label>
                  <button className="inline-flex items-center gap-2 rounded-full border border-[#5f2295] px-5 py-2.5 text-sm font-semibold text-[#5f2295]"><Save size={15}/> Save event</button>
                </form>
                <div className="mt-4 flex justify-end">
                  <AdminDeleteButton action={deleteEventDetail} confirmMessage={`Delete "${event.title}" from Day ${event.day_number}? It will be removed from participant dashboards.`} label="Delete event">
                    <input type="hidden" name="id" value={event.id}/>
                  </AdminDeleteButton>
                </div>
              </article>
            ))}
            {(!events || events.length === 0) && <p className="rounded-xl bg-[#f8f3ff] p-4 sm:p-5 text-sm text-[#76678a]">No event details have been added yet. Add your first event above.</p>}
          </div>
        </section>

        <section className="admin-section card-hover reveal-on-scroll mt-6 rounded-2xl border border-[#eadff5] bg-white/85 p-4 sm:mt-8 sm:p-8">
          <div className="mb-6"><p className="eyebrow">HACKATHON CONTENT</p><h2 className="editorial mt-2 text-3xl">Problem statements</h2><p className="mt-2 text-sm text-[#76678a]">Create, edit or unpublish organizer-defined statements. Only active statements appear in the participant dropdown.</p></div>
          <div className="card-hover mb-8 rounded-xl bg-[#f8f3ff] p-4 sm:p-5">
            <h3 className="font-semibold">Add a problem statement</h3>
            <form action={saveProblemStatement} className="mt-4 space-y-4">
              <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
                <label className={labelClass + " min-w-0"}>Title *<input required name="title" className={fieldClass}/></label>
                <label className={labelClass + " min-w-0"}>Domain<input name="domain" className={fieldClass} placeholder="e.g. Healthcare, Education"/></label>
                <label className={labelClass + " min-w-0"}>Difficulty<input name="difficulty" className={fieldClass} placeholder="e.g. Beginner, Intermediate"/></label>
                <label className={labelClass + " min-w-0"}>Sponsor<input name="sponsor" className={fieldClass}/></label>
                <label className={labelClass + " min-w-0"}>Maximum selections<input name="max_slots" type="number" min="0" className={fieldClass} placeholder="Leave blank for no limit"/></label>
                <label className={labelClass + " min-w-0"}>Display order<input name="display_order" type="number" defaultValue="0" className={fieldClass}/></label>
              </div>
              <label className={labelClass + " min-w-0"}>Short summary *<textarea required name="summary" rows={2} className={fieldClass}/></label>
              <label className={labelClass + " min-w-0"}>Full description<textarea name="description" rows={4} className={fieldClass}/></label>
              <label className={labelClass + " min-w-0"}>Technology hints<textarea name="tech_hints" rows={2} className={fieldClass}/></label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#57436d]"><input type="checkbox" name="is_active" defaultChecked className="size-4 accent-[#5f2295]"/> Publish immediately</label>
              <button className="inline-flex items-center gap-2 rounded-full bg-[#5f2295] px-6 py-3 text-sm font-semibold text-white"><Plus size={16}/> Add problem statement</button>
            </form>
          </div>
          <div className="space-y-5">
            {(problems ?? []).map((problem) => (
              <article key={problem.id} className="card-hover min-w-0 rounded-xl border border-[#eadff5] bg-white p-4 sm:p-5">
                <form action={saveProblemStatement}>
                  <input type="hidden" name="id" value={problem.id}/>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{problem.title}</h3><span className={problem.is_active ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-[#f1f2f4] px-3 py-1 text-xs font-semibold text-[#76678a]"}>{problem.is_active ? "Published" : "Unpublished"} · {problem.filled_slots} selected</span></div>
                  <div className="grid min-w-0 gap-3 sm:gap-4 sm:grid-cols-2">
                    <label className={labelClass + " min-w-0"}>Title *<input required name="title" defaultValue={problem.title} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Domain<input name="domain" defaultValue={problem.domain ?? ""} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Difficulty<input name="difficulty" defaultValue={problem.difficulty ?? ""} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Sponsor<input name="sponsor" defaultValue={problem.sponsor ?? ""} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Maximum selections<input name="max_slots" type="number" min="0" defaultValue={problem.max_slots ?? ""} className={fieldClass}/></label>
                    <label className={labelClass + " min-w-0"}>Display order<input name="display_order" type="number" defaultValue={problem.display_order} className={fieldClass}/></label>
                  </div>
                  <label className={labelClass + " mt-4"}>Short summary *<textarea required name="summary" rows={2} defaultValue={problem.summary} className={fieldClass}/></label>
                  <label className={labelClass + " mt-4"}>Full description<textarea name="description" rows={3} defaultValue={problem.description ?? ""} className={fieldClass}/></label>
                  <label className={labelClass + " mt-4"}>Technology hints<textarea name="tech_hints" rows={2} defaultValue={problem.tech_hints ?? ""} className={fieldClass}/></label>
                  <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[#57436d]"><input type="checkbox" name="is_active" defaultChecked={problem.is_active} className="size-4 accent-[#5f2295]"/> Published and visible to participants</label>
                  <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#5f2295] px-5 py-2.5 text-sm font-semibold text-[#5f2295]"><Save size={15}/> Save changes</button>
                </form>
                <div className="mt-4 flex justify-end"><AdminDeleteButton action={deleteProblemStatement} confirmMessage={`Delete "${problem.title}"? This is allowed only when no participant has selected it.`} label="Delete problem statement"><input type="hidden" name="id" value={problem.id}/></AdminDeleteButton></div>
              </article>
            ))}
            {(!problems || problems.length === 0) && <p className="rounded-xl bg-[#f8f3ff] p-4 sm:p-5 text-sm text-[#76678a]">No problem statements have been added yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
