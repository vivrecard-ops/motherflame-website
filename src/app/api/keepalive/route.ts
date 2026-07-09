import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/keepalive
 *
 * Called daily by the Vercel cron (see vercel.json).  Runs one real query
 * against Supabase so the project never counts as "inactive": the free tier
 * pauses projects after 7 days without activity, which would break
 * /api/validate — and after the desktop app's 7-day offline grace, paying
 * customers would lose META access.  A single SELECT per day keeps the
 * database awake at zero cost.  Harmless if the project later moves to a
 * paid plan (no pausing there).
 *
 * When a CRON_SECRET env var is set, Vercel sends it as a Bearer token and
 * we reject any caller that doesn't present it.  Without the env var the
 * endpoint stays open — acceptable, since it leaks nothing and one SELECT
 * is cheaper than the page load an attacker would use to spam us instead.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { error } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .limit(1);

  if (error) {
    console.error("[keepalive] Supabase query failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
