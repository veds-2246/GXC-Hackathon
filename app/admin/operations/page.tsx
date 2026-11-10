import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import { saveSnackPolicy, saveVolunteer, setVolunteerActive } from "@/app/admin/operations/actions";

type Summary = { total_registered: number; checked_in: number; snacks_distributed: number; pending_checkin: number; snack_policy: string; volunteers: Array<{user_id:string;email:string;name:string|null;permission:string;is_active:boolean}>; recent_activity: Array<{action:string;created_at:string;email:string|null;registration_id:string|null;details:Record<string,unknown>}> };

const field = "mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none focus:border-[#5f2295]";

export const dynamic = "force-dynamic";

export default async function OperationsAdminPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}) {
  const supabase = await createClient();
  const {data:{user},error} = await supabase.auth.getUser();
  if(error || !user) redirect("/login?next=/admin/operations");
  const {data:profile} = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role !== "admin") redirect("/");
  const [{data:summaryData},{data:settings}] = await Promise.all([
    supabase.rpc("event_operations_summary"),
    supabase.from("event_operations_settings").select("snack_policy").eq("id",1).maybeSingle(),
  ]);
  const summary = (Array.isArray(summaryData)?summaryData[0]:summaryData) as Summary | null;
  const params = await searchParams;
  const cards = [
    ["Registered participants",summary?.total_registered ?? 0],
    ["Checked in",summary?.checked_in ?? 0],
    ["Snacks distributed",summary?.snacks_distributed ?? 0],
    ["Awaiting check-in",summary?.pending_checkin ?? 0],
  ];
  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-3"><div className="surface-glass-nav flex min-h-[68px] items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-6"><Link href="/admin" className="font-extrabold tracking-tight text-[#32105b]">GENXCODE · ADMIN</Link><div className="flex items-center gap-3"><Link href="/admin" className="text-xs font-semibold text-[#69408e]">Event settings</Link><form action={signOut}><button className="rounded-full border border-[#eadff5] px-4 py-2 text-xs font-semibold">Sign out</button></form></div></div></header>
    <section className="container-shell py-10">
      <p className="eyebrow">ORGANIZER CONTROL ROOM</p><h1 className="editorial mt-3 text-4xl text-[#220749] sm:text-5xl">Event operations.</h1><p className="mt-3 text-sm text-[#76678a]">Manage volunteers, monitor attendance and review snack distribution.</p>
      {params.saved && <p role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800">Changes saved successfully.</p>}
      {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error === "policy" ? "Could not update snack policy." : "Could not update volunteer access. Check that the account exists."}</p>}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label,value])=><article key={String(label)} className="rounded-2xl border border-[#eadff5] bg-white p-4 sm:p-5"><p className="text-xs text-[#8a789d]">{label}</p><p className="editorial mt-2 text-3xl text-[#32105b]">{value}</p></article>)}</div>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-6"><p className="eyebrow">VOLUNTEER ACCESS</p><h2 className="editorial mt-2 text-3xl">Add a volunteer.</h2><p className="mt-2 text-xs leading-5 text-[#76678a]">The volunteer must sign in to the participant website once before you can assign access.</p>
          <form action={saveVolunteer} className="mt-5 space-y-3"><label className="block text-xs font-semibold text-[#57436d]">Account email<input required name="email" type="email" className={field}/></label><label className="block text-xs font-semibold text-[#57436d]">Permission<select name="permission" className={field}><option value="both">Check-in and snacks</option><option value="checkin">Check-in only</option><option value="snacks">Snack distribution only</option></select></label><button className="rounded-full bg-[#5f2295] px-5 py-3 text-sm font-semibold text-white">Save volunteer</button></form>
          <div className="mt-7 space-y-3">{(summary?.volunteers ?? []).map(v=><div key={v.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#faf7fd] p-3"><div className="min-w-0"><p className="break-all text-sm font-semibold text-[#32105b]">{v.name || v.email}</p><p className="break-all text-xs text-[#8a789d]">{v.email} · {v.permission}</p><span className={v.is_active?"text-[10px] font-bold text-green-700":"text-[10px] font-bold text-red-700"}>{v.is_active?"ACTIVE":"INACTIVE"}</span></div><form action={setVolunteerActive}><input type="hidden" name="user_id" value={v.user_id}/><input type="hidden" name="active" value={String(!v.is_active)}/><button className="rounded-full border border-[#eadff5] px-3 py-2 text-xs font-semibold">{v.is_active?"Deactivate":"Activate"}</button></form></div>)}</div>
        </section>
        <section className="rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-6"><p className="eyebrow">SNACK CONFIGURATION</p><h2 className="editorial mt-2 text-3xl">Distribution rules.</h2><p className="mt-2 text-xs leading-5 text-[#76678a]">Choose how often each participant can claim snacks. The database enforces this even when multiple volunteers scan at once.</p>
          <form action={saveSnackPolicy} className="mt-5 space-y-3"><label className="block text-xs font-semibold text-[#57436d]">Snack eligibility<select name="snack_policy" defaultValue={settings?.snack_policy ?? "event"} className={field}><option value="event">Once for the entire event</option><option value="daily">Once per event day</option></select></label><button className="rounded-full bg-[#5f2295] px-5 py-3 text-sm font-semibold text-white">Save distribution rule</button></form>
          <div className="mt-7 rounded-xl bg-[#f8f2ff] p-4"><p className="text-sm font-bold text-[#32105b]">Current attendance</p><p className="mt-2 text-sm text-[#76678a]">{summary?.checked_in ?? 0} of {summary?.total_registered ?? 0} confirmed participants have checked in.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8dcf2]"><div className="h-full rounded-full bg-[#5f2295]" style={{width:`${summary?.total_registered ? Math.min(100,(summary.checked_in/summary.total_registered)*100) : 0}%`}}/></div></div>
          <button type="button" onClick={undefined as never} className="hidden">Export</button>
        </section>
      </div>
      <section className="mt-7 rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">AUDIT TRAIL</p><h2 className="editorial mt-2 text-3xl">Recent activity.</h2></div><span className="text-xs text-[#8a789d]">Latest 50 actions</span></div>
        <div className="mt-5 space-y-2">{(summary?.recent_activity ?? []).length===0?<p className="py-8 text-center text-sm text-[#8a789d]">No event activity recorded yet.</p>:(summary?.recent_activity ?? []).map((item,index)=><div key={`${item.created_at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f2edf6] py-3 last:border-0"><div><p className="text-sm font-semibold text-[#32105b]">{item.action.replaceAll("_"," ")}</p><p className="text-xs text-[#8a789d]">{item.email || "System"} {item.registration_id ? `· ${item.registration_id.slice(0,8)}` : ""}</p></div><time className="text-xs text-[#8a789d]">{new Date(item.created_at).toLocaleString("en-IN")}</time></div>)}</div>
      </section>
      <div className="mt-6"><Link href="/volunteer/dashboard" className="text-sm font-semibold text-[#69408e]">Open volunteer scanner →</Link></div>
    </section>
  </main>;
}