import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin as _supabaseAdmin } from "@/lib/supabase/admin";
import { checkValidateRateLimit } from "@/lib/rate-limit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin = _supabaseAdmin as any;

export async function POST(request: NextRequest) {
  // Per-IP rate limit BEFORE reading the body.  This is the primary defence
  // against brute-force enumeration of license keys: without it, an attacker
  // could try millions of keys per minute until they hit a valid one.
  const rl = await checkValidateRateLimit(request);
  if (rl.rateLimited) {
    return NextResponse.json(
      { valid: false, error: "Too many requests" },
      {
        status:  429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

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
      .select("license_key, status, current_period_end")
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

    // Defence-in-depth: even if the row's status is still "active", refuse
    // access once the paid period has lapsed.  Status alone is unreliable
    // because Stripe webhooks can be missed (network blip, retry storm, etc.)
    // — the period_end is an authoritative cut-off written by the same
    // webhook that flipped the status, so checking both leaves no window
    // where a cancelled subscription keeps working.
    const now = Date.now();
    const periodEnd = data.current_period_end
      ? Date.parse(data.current_period_end)
      : null;
    const periodOk = periodEnd === null || (Number.isFinite(periodEnd) && periodEnd > now);

    const valid = data.status === "active" && periodOk;

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
