import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Code2, LogOut, UserRound, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import { DashboardUpdates } from "@/components/dashboard-updates";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: payment } = await supabase.from("payment_orders")
    .select("id,provider_payment_id,paid_at").eq("user_id", user.id).eq("status", "paid")
    .order("paid_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment) redirect("/checkout");

  const [{ data: profile }, { data: registration }] = await Promise.all([
    supabase.from("profiles").select("full_name,email,role").eq("id", user.id).maybeSingle(),
    supabase.from("registrations").select("id,application_number,status").eq("created_by", user.id).neq("status", "cancelled").maybeSingle(),
  ]);
  if (!registration) redirect("/register");

  const [{ data: events }, { data: problems }, { data: selection }] = await Promise.all([
    supabase.from("event_details").select("id,day_number,title,venue,timing,pre_instructions").eq("is_published", true).order("day_number").order("display_order"),
    supabase.from("problem_statements").select("id,title,summary,domain,difficulty,max_slots,filled_slots").eq("is_active", true).order("display_order"),
    supabase.from("registration_problem_statements").select("problem_statement_id").eq("registration_id", registration.id).maybeSingle(),
  ]);

  const name = profile?.full_name || "Participant";
  return <main className="min-h-screen bg-[#fafaf7]">
    <header className="border-b border-[#e4e4dd] bg-white"><div className="container-shell flex h-[76px] items-center justify-between">
      <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={21}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Dashboard</span></span></Link>
      <div className="flex items-center gap-3">
        {profile?.role === "admin" && <Link href="/admin" className="inline-flex items-center gap-1 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold hover:bg-[#f4f4ef]">Admin panel <ArrowUpRight size={13}/></Link>}
        <form action={signOut}><button className="inline-flex items-center gap-2 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold hover:bg-[#f4f4ef]"><LogOut size={14}/> Sign out</button></form>
      </div>
    </div></header>
    <section className="container-shell py-14">
      <p className="eyebrow mb-4">PARTICIPANT SPACE</p><h1 className="editorial text-5xl sm:text-6xl">Good to have you here, {name.split(" ")[0]}.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#697386]">Your GenXCode Tech Fest pass is active. Your registration details and event updates will appear here.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-[#e4e4dd] bg-white p-7"><div className="mb-8 flex items-center justify-between"><span className="eyebrow">YOUR ACCOUNT</span><UserRound className="text-[#1a56db]" size={21}/></div>
          <p className="text-xs text-[#9aa1ad]">Signed in as</p><p className="mt-1 break-all text-lg font-semibold">{user.email}</p>
          <p className="mt-5 text-xs text-[#9aa1ad]">Application number</p><p className="editorial mt-1 text-3xl">{registration.application_number}</p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#1e8e3e]"><CheckCircle2 size={15}/> Payment verified</p>
        </article>
        <article className="rounded-2xl bg-[#0b0f19] p-7 text-white"><p className="text-[10px] font-bold tracking-[.18em] text-[#8db2ff]">REGISTRATION STATUS</p><h2 className="editorial mt-5 text-3xl">You’re on the list.</h2><p className="mt-3 text-sm leading-6 text-[#a4adbd]">Your individual hackathon registration has been submitted. Prompt Wars setup will be added after the MVP.</p><p className="mt-8 text-xs font-semibold capitalize text-[#8db2ff]">{registration.status}</p></article>
      </div>
      <DashboardUpdates events={events ?? []} problems={problems ?? []} selectedProblemStatementId={selection?.problem_statement_id ?? null}/>
    </section>
  </main>;
}
