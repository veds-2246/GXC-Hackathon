"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function validHttpsUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:"; } catch { return false; }
}

export async function saveProjectSubmission(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/submission");

  const [{ data: registration }, { data: window }] = await Promise.all([
    supabase.from("registrations").select("id").eq("created_by", user.id).eq("status", "confirmed").maybeSingle(),
    supabase.from("project_submission_settings").select("is_open,closes_at").eq("id", 1).maybeSingle(),
  ]);
  if (!registration) redirect("/dashboard/submission?error=registration");
  if (!window?.is_open || (window.closes_at && new Date(window.closes_at).getTime() <= Date.now())) redirect("/dashboard/submission?error=closed");

  const projectTitle = String(formData.get("project_title") ?? "").trim();
  const problemStatementId = String(formData.get("problem_statement_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const solutionFeatures = String(formData.get("solution_features") ?? "").trim();
  const githubUrl = String(formData.get("github_url") ?? "").trim();
  const productionUrl = String(formData.get("production_url") ?? "").trim();
  const declaration = formData.get("declaration") === "on";
  if (projectTitle.length < 3 || projectTitle.length > 120 || !problemStatementId || description.length < 20 || description.length > 3000 ||
      solutionFeatures.length < 10 || solutionFeatures.length > 3000 || !validHttpsUrl(githubUrl) || !validHttpsUrl(productionUrl) || !declaration) {
    redirect("/dashboard/submission?error=validation");
  }

  const { data: existing } = await supabase.from("project_submissions").select("id,presentation_path").eq("registration_id", registration.id).maybeSingle();
  const file = formData.get("presentation");
  let presentationPath = existing?.presentation_path ?? "";
  if (file instanceof File && file.size > 0) {
    const isPptx = file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" && file.name.toLowerCase().endsWith(".pptx");
    const isPpt = file.type === "application/vnd.ms-powerpoint" && file.name.toLowerCase().endsWith(".ppt");
    if ((!isPptx && !isPpt) || file.size > 15 * 1024 * 1024) redirect("/dashboard/submission?error=file");
    const extension = isPptx ? "pptx" : "ppt";
    presentationPath = `${user.id}/${registration.id}/presentation.${extension}`;
    const { error: uploadError } = await supabase.storage.from("project-presentations").upload(presentationPath, file, {
      upsert: true, contentType: file.type, cacheControl: "3600",
    });
    if (uploadError) redirect("/dashboard/submission?error=upload");
  }
  if (!presentationPath) redirect("/dashboard/submission?error=file");

  const payload = {
    registration_id: registration.id, user_id: user.id, project_title: projectTitle,
    problem_statement_id: problemStatementId, description, solution_features: solutionFeatures,
    github_url: githubUrl, production_url: productionUrl, presentation_path: presentationPath,
  };
  const result = existing
    ? await supabase.from("project_submissions").update(payload).eq("id", existing.id)
    : await supabase.from("project_submissions").insert(payload);
  if (result.error) redirect("/dashboard/submission?error=save");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/submission");
  revalidatePath("/admin/submissions");
  redirect("/dashboard/submission?saved=1");
}
