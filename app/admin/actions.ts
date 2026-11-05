"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  return { supabase, user };
}

export async function saveWorkshopSettings(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const venue = String(formData.get("venue") ?? "").trim();
  const timing = String(formData.get("timing") ?? "").trim();
  const preInstructions = String(formData.get("pre_instructions") ?? "").trim();

  const { error } = await supabase.from("event_workshop_settings").update({
    venue: venue || null,
    timing: timing || null,
    pre_instructions: preInstructions || null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }).eq("id", 1);

  if (error) redirect("/admin?error=workshop");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=workshop");
}

export async function saveProblemStatement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const maxSlotsValue = String(formData.get("max_slots") ?? "").trim();
  const maxSlots = maxSlotsValue ? Number.parseInt(maxSlotsValue, 10) : null;
  const displayOrder = Number.parseInt(String(formData.get("display_order") ?? "0"), 10);

  if (!title || !summary || (maxSlots !== null && (!Number.isInteger(maxSlots) || maxSlots < 0))) {
    redirect("/admin?error=problem");
  }

  const payload = {
    title,
    summary,
    description: String(formData.get("description") ?? "").trim() || null,
    domain: String(formData.get("domain") ?? "").trim() || null,
    difficulty: String(formData.get("difficulty") ?? "").trim() || null,
    tech_hints: String(formData.get("tech_hints") ?? "").trim() || null,
    sponsor: String(formData.get("sponsor") ?? "").trim() || null,
    max_slots: maxSlots,
    display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
    is_active: formData.get("is_active") === "on",
  };

  const result = id
    ? await supabase.from("problem_statements").update(payload).eq("id", id)
    : await supabase.from("problem_statements").insert(payload);

  if (result.error) redirect("/admin?error=problem");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=problem");
}
