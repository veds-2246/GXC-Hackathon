"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/operations");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");
  return supabase;
}

export async function saveVolunteer(formData: FormData) {
  const supabase = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const permission = String(formData.get("permission") ?? "both");
  const { error } = await supabase.rpc("admin_upsert_event_volunteer", { p_email: email, p_permission: permission });
  if (error) redirect("/admin/operations?error=volunteer");
  revalidatePath("/admin/operations");
  redirect("/admin/operations?saved=volunteer");
}

export async function setVolunteerActive(formData: FormData) {
  const supabase = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const active = formData.get("active") === "true";
  const { error } = await supabase.rpc("admin_set_event_volunteer_active", { p_user_id: userId, p_active: active });
  if (error) redirect("/admin/operations?error=volunteer");
  revalidatePath("/admin/operations");
  redirect("/admin/operations?saved=volunteer");
}

export async function saveSnackPolicy(formData: FormData) {
  const supabase = await requireAdmin();
  const policy = String(formData.get("snack_policy") ?? "");
  const { error } = await supabase.rpc("admin_set_snack_policy", { p_policy: policy });
  if (error) redirect("/admin/operations?error=policy");
  revalidatePath("/admin/operations");
  redirect("/admin/operations?saved=policy");
}