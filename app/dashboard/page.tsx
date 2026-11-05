import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Code2, LogOut, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  const userId = data.claims.sub;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", userId)
    .maybeSingle();

  const email = typeof data.claims.email === "string" ? data.claims.email : profile?.email ?? "";
  const metadata = data.claims.user_metadata as { full_name?: string } | undefined;
  const name = profile?.full_name || metadata?.full_name || "Participant";

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <header className="border-b border-[#e4e4dd] bg-white">
        <div className="container-shell flex h-[76px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={21}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Dashboard</span></span></Link>
          <form action={signOut}><button className="inline-flex items-center gap-2 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold transition hover:bg-[#f4f4ef]"><LogOut size={14}/> Sign out</button></form>
        </div>
      </header>
      <section className="container-shell py-14">
        <p className="eyebrow mb-4">PARTICIPANT SPACE</p>
        <h1 className="editorial text-5xl sm:text-6xl">Good to have you here{name !== "Participant" ? `, ${name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#697386]">Your GenXCode Tech Fest account is ready. We’ll bring your registration and event updates together here.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
          <article className="rounded-2xl border border-[#e4e4dd] bg-white p-7">
            <div className="mb-8 flex items-center justify-between"><span className="eyebrow">YOUR ACCOUNT</span><UserRound className="text-[#1a56db]" size={21}/></div>
            <p className="text-xs text-[#9aa1ad]">Signed in as</p><p className="mt-1 break-all text-lg font-semibold">{email}</p>
            <p className="mt-5 text-xs text-[#9aa1ad]">Account type</p><p className="mt-1 text-sm font-semibold capitalize">{profile?.role ?? "applicant"}</p>
          </article>
          <article className="rounded-2xl bg-[#0b0f19] p-7 text-white">
            <p className="text-[10px] font-bold tracking-[.18em] text-[#8db2ff]">UP NEXT</p>
            <h2 className="editorial mt-5 text-3xl">Your registration journey starts here.</h2>
            <p className="mt-3 text-sm leading-6 text-[#a4adbd]">Complete your profile, choose a problem statement and submit your hackathon idea.</p>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-[#111827] transition hover:bg-[#dce7ff]">Start registration <ArrowUpRight size={14}/></Link>
          </article>
        </div>
      </section>
    </main>
  );
}
