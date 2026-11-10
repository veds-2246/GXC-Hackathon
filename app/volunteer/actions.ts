"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function volunteerSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/volunteer/login?error=missing");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/volunteer/login?error=invalid");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/volunteer/login?error=invalid");
  const { data: permission } = await supabase.rpc("event_actor_permission");
  if (!permission) {
    await supabase.auth.signOut();
    redirect("/volunteer/login?error=not-assigned");
  }
  redirect("/volunteer/dashboard");
}