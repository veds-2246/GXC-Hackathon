import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csv(value: unknown) {
  const text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.rpc("event_operations_export");
  if (error) return NextResponse.json({ error: "Admin access required to export event records." }, { status: 403 });
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const headers = ["Participant", "Email", "Application number", "Checked in at", "Checked in by", "Snack claims"];
  const fields = ["participant_name", "participant_email", "application_number", "checked_in_at", "checked_in_by_email", "snack_claims"];
  const content = [headers.map(csv).join(","), ...rows.map(row => fields.map(field => csv(row[field])).join(","))].join("\r\n");
  return new Response(content, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="gxc-event-operations.csv"',
    "Cache-Control": "no-store",
  }});
}