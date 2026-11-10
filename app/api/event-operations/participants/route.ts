import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const { data, error: searchError } = await supabase.rpc("event_search_participants", { p_query: query });
  if (searchError) return NextResponse.json({ error: searchError.message.includes("Volunteer access") ? searchError.message : "Could not search participants." }, { status: 403 });
  return NextResponse.json({ participants: data ?? [] }, { headers: { "Cache-Control": "no-store, private" } });
}