"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/submissions");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");
  return { supabase, user };
}

export async function updateSubmissionWindow(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const isOpen = formData.get("is_open") === "on";
  const rawClose = String(formData.get("closes_at") ?? "").trim();
  let closesAt: string | null = null;
  if (rawClose) {
    const parsed = new Date(rawClose + ":00+05:30");
    if (Number.isNaN(parsed.getTime())) redirect("/admin/submissions?error=window");
    closesAt = parsed.toISOString();
  }
  const { error } = await supabase.from("project_submission_settings").upsert({
    id: 1, is_open: isOpen, closes_at: closesAt, updated_at: new Date().toISOString(), updated_by: user.id,
  }, { onConflict: "id" });
  if (error) redirect("/admin/submissions?error=window");
  revalidatePath("/admin/submissions");
  revalidatePath("/dashboard/submission");
  redirect("/admin/submissions?saved=window");
}

export async function reviewSubmission(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const rawScore = String(formData.get("score") ?? "").trim();
  const score = rawScore ? Number(rawScore) : null;
  const remarks = String(formData.get("judge_remarks") ?? "").trim();
  if (!id || !["pending","under_review","shortlisted","rejected","winner"].includes(status) ||
      (score !== null && (!Number.isFinite(score) || score < 0 || score > 100))) redirect("/admin/submissions?error=review");
  const { error } = await supabase.from("project_submissions").update({ status, score, judge_remarks: remarks || null }).eq("id", id);
  if (error) redirect("/admin/submissions?error=review");
  revalidatePath("/admin/submissions");
  redirect("/admin/submissions?saved=review");
}
