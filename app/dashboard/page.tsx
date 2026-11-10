import { BrandLockup } from "@/components/brand-lockup";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, UserRound, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import { DashboardUpdates } from "@/components/dashboard-updates";
import { WhatsAppChannelFloat } from "@/components/whatsapp-channel-float";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const [{ data: profile }, { data: registration }] = await Promise.all([
    supabase.from("profiles").select("full_name,email,role").eq("id", user.id).maybeSingle(),
    supabase.from("registrations").select("id,application_number,status").eq("created_by", user.id).neq("status", "cancelled").maybeSingle(),
  ]);
  if (!registration) redirect("/register");

  const [{ data: events }, { data: problems }, { data: selection }, { data: scheduleSettings }] = await Promise.all([
    supabase.from("event_details").select("id,day_number,title,venue,timing,pre_instructions").eq("is_published", true).order("day_number").order("created_at"),
    supabase.from("problem_statements").select("id,title,summary,domain,difficulty,max_slots,filled_slots").eq("is_active", true).order("display_order"),
    supabase.from("registration_problem_statements").select("problem_statement_id").eq("registration_id", registration.id).maybeSingle(),
    supabase.from("event_schedule_settings").select("whatsapp_channel_url").eq("id", 1).maybeSingle(),
  ]);

  const name = profile?.full_name || "Participant";
  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-3"><div className="surface-glass-nav flex min-h-[68px] flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 sm:min-h-[76px] sm:flex-nowrap sm:px-6">
      <BrandLockup />
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <Link href="/dashboard/submission" className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-[#eadff5] px-3 py-2.5 text-[11px] font-semibold text-[#5f2295] sm:px-4 sm:text-xs">Project submission</Link>
        <Link href="/dashboard/pass" className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full bg-[#f4effc] px-3 py-2.5 text-[11px] font-semibold text-[#5f2295] sm:px-4 sm:text-xs"><span aria-hidden="true">▦</span> My Pass</Link>
        {profile?.role === "admin" && <><Link href="/admin" className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap rounded-full border border-[#e4e4dd] px-3 py-2.5 text-[11px] font-semibold sm:px-4 sm:text-xs hover:bg-[#f4f4ef]">Admin panel</Link><Link href="/admin/operations" className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap rounded-full bg-[#f4effc] px-3 py-2.5 text-[11px] font-semibold text-[#5f2295] sm:px-4 sm:text-xs">Operations</Link></>}
        <form action={signOut}><button className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-[#e4e4dd] px-3 py-2.5 text-[11px] font-semibold sm:px-4 sm:text-xs hover:bg-[#f4f4ef]"><LogOut size={14}/> Sign out</button></form>
      </div>
    </div></header>
    <section className="container-shell py-14">
      <p className="eyebrow mb-4">PARTICIPANT SPACE</p><h1 className="editorial text-4xl leading-tight sm:text-6xl">Good to have you here, {name.split(" ")[0]}.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#76678a]">Your GenXCode Hackathon registration is active. Your registration details and event updates will appear here.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
        <article className="card-hover min-w-0 rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-7"><div className="mb-8 flex items-center justify-between"><span className="eyebrow">YOUR ACCOUNT</span><UserRound className="text-[#5f2295]" size={21}/></div>
          <p className="text-xs text-[#9aa1ad]">Signed in as</p><p className="mt-1 break-all text-lg font-semibold">{user.email}</p>
          <p className="mt-5 text-xs text-[#9aa1ad]">Application number</p><p className="editorial mt-1 text-3xl">{registration.application_number}</p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#1e8e3e]"><CheckCircle2 size={15}/> Registration confirmed</p>
        </article>
        <article className="cta-panel card-hover min-w-0 p-5 sm:p-7"><p className="text-[10px] font-bold tracking-[.18em] text-[#e2d1fe]">REGISTRATION STATUS</p><h2 className="editorial mt-5 text-3xl">You’re on the list.</h2><p className="mt-3 text-sm leading-6 text-white/80">Your individual hackathon registration has been submitted. Prompt Wars setup will be added after the MVP.</p><p className="mt-8 text-xs font-semibold capitalize text-[#8db2ff]">{registration.status}</p></article>
      </div>
      <DashboardUpdates events={events ?? []} problems={problems ?? []} selectedProblemStatementId={selection?.problem_statement_id ?? null}/>
    </section>
    <WhatsAppChannelFloat url={scheduleSettings?.whatsapp_channel_url ?? null}/>
  </main>;
}
