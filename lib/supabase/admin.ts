import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Missing server-only Supabase secret. Set SUPABASE_SECRET_KEY in the deployment environment.");
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}
