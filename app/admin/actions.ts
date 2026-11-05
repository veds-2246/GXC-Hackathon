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

export async function saveEventDayCount(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const dayCount = Number.parseInt(String(formData.get("day_count") ?? ""), 10);
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 31) redirect("/admin?error=day-count");

  const { count, error: lookupError } = await supabase.from("event_details")
    .select("id", { count: "exact", head: true }).gt("day_number", dayCount);
  if (lookupError) redirect("/admin?error=day-count");
  if ((count ?? 0) > 0) redirect("/admin?error=days-in-use");

  const { error } = await supabase.from("event_schedule_settings").upsert({
    id: 1, day_count: dayCount, updated_at: new Date().toISOString(), updated_by: user.id,
  }, { onConflict: "id" });
  if (error) redirect("/admin?error=day-count");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=day-count");
}

export async function saveWhatsappChannelLink(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const rawUrl = String(formData.get("whatsapp_channel_url") ?? "").trim();
  let channelUrl: string | null = null;

  if (rawUrl) {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      redirect("/admin?error=whatsapp-channel");
    }

    const allowedHost = parsed.hostname === "whatsapp.com" || parsed.hostname === "www.whatsapp.com";
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (parsed.protocol !== "https:" || !allowedHost || pathParts[0] !== "channel" || !pathParts[1]) {
      redirect("/admin?error=whatsapp-channel");
    }
    channelUrl = parsed.toString();
  }

  const { error } = await supabase.from("event_schedule_settings").update({
    whatsapp_channel_url: channelUrl,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }).eq("id", 1);

  if (error) redirect("/admin?error=whatsapp-channel");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=whatsapp-channel");
}

export async function saveEventDetail(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const dayNumber = Number.parseInt(String(formData.get("day_number") ?? ""), 10);
  const { data: settings } = await supabase.from("event_schedule_settings").select("day_count").eq("id", 1).maybeSingle();
  if (!title || !settings || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > settings.day_count) {
    redirect("/admin?error=event-detail");
  }

  const payload = {
    day_number: dayNumber,
    title,
    venue: String(formData.get("venue") ?? "").trim() || null,
    timing: String(formData.get("timing") ?? "").trim() || null,
    pre_instructions: String(formData.get("pre_instructions") ?? "").trim() || null,
    is_published: formData.get("is_published") === "on",
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };
  const result = id
    ? await supabase.from("event_details").update(payload).eq("id", id)
    : await supabase.from("event_details").insert(payload);
  if (result.error) redirect("/admin?error=event-detail");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=event-detail");
}

export async function deleteEventDetail(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin?error=event-delete");
  const { error } = await supabase.from("event_details").delete().eq("id", id);
  if (error) redirect("/admin?error=event-delete");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=event-delete");
}

export async function saveProblemStatement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const maxSlotsValue = String(formData.get("max_slots") ?? "").trim();
  const maxSlots = maxSlotsValue ? Number.parseInt(maxSlotsValue, 10) : null;
  const displayOrder = Number.parseInt(String(formData.get("display_order") ?? "0"), 10);
  if (!title || !summary || (maxSlots !== null && (!Number.isInteger(maxSlots) || maxSlots < 0))) redirect("/admin?error=problem");

  const payload = {
    title, summary,
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

export async function deleteProblemStatement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin?error=problem");
  const { count, error: usageError } = await supabase.from("registration_problem_statements")
    .select("registration_id", { count: "exact", head: true }).eq("problem_statement_id", id);
  if (usageError) redirect("/admin?error=problem");
  if ((count ?? 0) > 0) redirect("/admin?error=problem-in-use");
  const { error } = await supabase.from("problem_statements").delete().eq("id", id);
  if (error) redirect("/admin?error=problem-delete");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=problem-delete");
}
