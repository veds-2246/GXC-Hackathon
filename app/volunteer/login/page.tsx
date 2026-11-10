import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { volunteerSignIn } from "@/app/volunteer/actions";

export default async function VolunteerLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: permission } = await supabase.rpc("event_actor_permission");
    if (permission) redirect("/volunteer/dashboard");
  }
  const params = await searchParams;
  const errors: Record<string, string> = {
    missing: "Enter your email and password.",
    invalid: "Email or password is incorrect.",
    "not-assigned": "This account has not been assigned volunteer access. Contact an event admin.",
  };
  return <main className="min-h-screen bg-[#fcfaff] px-4 py-12">
    <section className="mx-auto mt-10 max-w-md rounded-3xl border border-[#eadff5] bg-white p-7 shadow-sm sm:p-9">
      <p className="eyebrow">GENXCODE EVENT OPERATIONS</p>
      <h1 className="editorial mt-3 text-4xl text-[#220749]">Volunteer sign in.</h1>
      <p className="mt-3 text-sm leading-6 text-[#76678a]">Use the account email and password assigned to you by an event admin.</p>
      {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors[params.error] ?? "Unable to sign in."}</p>}
      <form action={volunteerSignIn} className="mt-7 space-y-4">
        <label className="block text-xs font-semibold text-[#57436d]">Email<input required name="email" type="email" autoComplete="username" className="mt-2 w-full rounded-xl border border-[#eadff5] px-4 py-3 text-sm outline-none focus:border-[#5f2295]" /></label>
        <label className="block text-xs font-semibold text-[#57436d]">Password<input required name="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#eadff5] px-4 py-3 text-sm outline-none focus:border-[#5f2295]" /></label>
        <button className="w-full rounded-full bg-[#5f2295] px-6 py-3 text-sm font-semibold text-white">Sign in to operations</button>
      </form>
      <a href="/login" className="mt-6 inline-block text-xs font-semibold text-[#69408e]">Participant login</a>
    </section>
  </main>;
}