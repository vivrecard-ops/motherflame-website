import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin as _supabaseAdmin } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin = _supabaseAdmin as any;

export async function POST(request: NextRequest) {
  let licenseKey: string | undefined;

  try {
    const body = await request.json();
    licenseKey = body.license_key;
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!licenseKey || typeof licenseKey !== "string") {
    return NextResponse.json(
      { valid: false, error: "Missing license_key" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("licenses")
      .select("license_key, status, current_period_end, email")
      .eq("license_key", licenseKey.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("[validate] db error", error);
      return NextResponse.json(
        { valid: false, error: "Database error" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ valid: false, error: "License not found" }, { status: 404 });
    }

    const valid = data.status === "active";

    return NextResponse.json({
      valid,
      status: data.status,
      current_period_end: data.current_period_end ?? null,
    });
  } catch (err) {
    console.error("[validate] handler error", err);
    return NextResponse.json(
      { valid: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
