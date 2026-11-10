import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Please sign in to access your digital pass." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase.rpc("issue_digital_pass_token");

  if (error) {
    const message = error.message.includes("confirmed registration")
      ? "A confirmed registration is required to access your digital pass."
      : "We couldn't generate your pass right now. Please try again.";

    return NextResponse.json(
      { error: message },
      {
        status: error.message.includes("confirmed registration") ? 403 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const issued = Array.isArray(data) ? data[0] : data;
  if (!issued?.token || !issued?.expires_at) {
    return NextResponse.json(
      { error: "The pass service returned an invalid response." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { token: issued.token, expiresAt: issued.expires_at },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
