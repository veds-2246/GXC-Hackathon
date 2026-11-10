import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Resolve the signed-in user's canonical destination without changing their session.
 * Admins and volunteers are checked before participant registration.
 */
export async function getAuthenticatedDestination(
  supabase: ServerSupabaseClient,
  fallback = "/register",
) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") return "/admin";

  const { data: volunteerPermission } = await supabase.rpc("event_actor_permission");
  if (volunteerPermission) return "/volunteer/dashboard";

  const { data: registration } = await supabase
    .from("registrations")
    .select("id")
    .eq("created_by", user.id)
    .neq("status", "cancelled")
    .maybeSingle();

  return registration ? "/dashboard" : fallback;
}
