import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DigitalPass } from "@/components/digital-pass";

export const dynamic = "force-dynamic";

export default async function DigitalPassPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login?next=/dashboard/pass");

  const [{ data: profile }, { data: registration }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("registrations")
      .select("application_number,status")
      .eq("created_by", user.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!registration) redirect("/register");

  return (
    <main className="min-h-screen bg-[#fcfaff]">
      <header className="container-shell pt-3">
        <div className="surface-glass-nav flex min-h-[68px] items-center justify-between rounded-2xl px-4 py-3 sm:min-h-[76px] sm:px-6">
          <a href="/dashboard" className="text-lg font-extrabold tracking-tight text-[#32105b]">GENXCODE</a>
          <span className="rounded-full bg-[#f4effc] px-3 py-2 text-xs font-semibold text-[#5f2295]">Official participant pass</span>
        </div>
      </header>
      <DigitalPass
        fullName={profile?.full_name || user.user_metadata?.full_name || "Participant"}
        applicationNumber={registration.application_number || "Pending"}
      />
    </main>
  );
}
