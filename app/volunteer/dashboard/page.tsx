import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";
import { EventOperationsScanner } from "@/components/event-operations-scanner";
import { EventOperationsReports } from "@/components/event-operations-reports";
import { formatStaffIdentifier } from "@/lib/format-staff-identifier";

export const dynamic = "force-dynamic";

export default async function VolunteerDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/volunteer/login");
  const [{ data: permission }, { data: settings }, { data: profile }] = await Promise.all([
    supabase.rpc("event_actor_permission"),
    supabase.from("event_schedule_settings").select("day_count").eq("id", 1).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  if (!permission) redirect("/volunteer/login?error=not-assigned");
  return <main className="min-h-screen bg-[#fcfaff]">
    <header className="container-shell pt-3"><div className="surface-glass-nav flex min-h-[68px] items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-6"><Link href="/" className="font-extrabold tracking-tight text-[#32105b]">GENXCODE</Link><form action={signOut}><button className="rounded-full border border-[#eadff5] px-4 py-2 text-xs font-semibold">Sign out</button></form></div></header>
    <section className="container-shell py-10"><p className="eyebrow">VOLUNTEER OPERATIONS</p><p className="mt-2 text-xs font-semibold text-[#5f2295]">Staff ID: {formatStaffIdentifier(profile?.full_name)}</p><h1 className="editorial mt-3 text-4xl text-[#220749] sm:text-5xl">Event check-in desk.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#76678a]">Signed in as {user.email}. Scan a participant's live QR pass to check them in or record snack distribution.</p><EventOperationsScanner dayCount={settings?.day_count ?? 1} permission={permission}/><EventOperationsReports allowExport={false}/></section>
  </main>;
}