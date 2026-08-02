import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin as _supabaseAdmin } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin = _supabaseAdmin as any;

const RELEASES_API =
  "https://api.github.com/repos/vivrecard-ops/motherflame-releases/releases";

/**
 * GET /api/keepalive
 *
 * Called daily by the Vercel cron (see vercel.json).  Two jobs:
 *
 * 1. Keep Supabase awake: the free tier pauses projects after 7 days without
 *    activity, which would break /api/validate — and after the desktop app's
 *    7-day offline grace, paying customers would lose META access.  One real
 *    query per day prevents that.  Harmless on paid plans.
 *
 * 2. Growth stats snapshot: GitHub only exposes CUMULATIVE download counts
 *    per release asset — no per-day history.  We record today's totals into
 *    download_stats (one row per asset per day, upserted so a manual re-run
 *    the same day just refreshes the row).  Day-over-day deltas = daily
 *    downloads.  We also snapshot the active-license count under the
 *    pseudo-asset "active_licenses".  Stats failures never fail the
 *    keep-alive — job 1 is the critical one.
 *
 * When a CRON_SECRET env var is set, Vercel sends it as a Bearer token and
 * we reject any caller that doesn't present it.  Without the env var the
 * endpoint stays open — acceptable: it leaks nothing sensitive and the
 * upsert is idempotent per day.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── Job 1: keep the database awake (critical) ────────────────────────────
  const { error } = await supabaseAdmin.from("licenses").select("id").limit(1);

  if (error) {
    console.error("[keepalive] Supabase query failed:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  // ── Job 2: daily growth snapshot (best-effort) ───────────────────────────
  let snapshots = 0;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows: Array<{
      snapshot_date: string;
      version: string;
      asset: string;
      downloads: number;
    }> = [];

    const gh = await fetch(RELEASES_API, {
      headers: {
        "User-Agent": "motherflame-stats",
        Accept: "application/vnd.github+json",
      },
      // Cron runs once a day — never serve a stale cached count.
      cache: "no-store",
    });
    if (gh.ok) {
      const releases = (await gh.json()) as Array<{
        tag_name: string;
        assets: Array<{ name: string; download_count: number }>;
      }>;
      for (const rel of releases) {
        for (const asset of rel.assets) {
          const platform = asset.name.includes("-mac-") ? "mac" : "windows";
          const kind = /\.(exe|dmg)$/.test(asset.name) ? "installer" : "zip";
          rows.push({
            snapshot_date: today,
            version: rel.tag_name,
            // Platform-qualified so Windows and Mac installers/zips never
            // collide in the same (date, version, asset) row — older rows
            // from before the Mac build existed keep their un-qualified
            // "installer"/"zip" value and just read as "windows" in /stats.
            asset: `${platform}_${kind}`,
            downloads: asset.download_count,
          });
        }
      }
    } else {
      console.error("[keepalive] GitHub API returned", gh.status);
    }

    const { count } = await supabaseAdmin
      .from("licenses")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    if (typeof count === "number") {
      rows.push({
        snapshot_date: today,
        version: "-",
        asset: "active_licenses",
        downloads: count,
      });
    }

    if (rows.length) {
      const { error: upsertErr } = await supabaseAdmin
        .from("download_stats")
        .upsert(rows, { onConflict: "snapshot_date,version,asset" });
      if (upsertErr) {
        console.error("[keepalive] stats upsert failed:", upsertErr);
      } else {
        snapshots = rows.length;
      }
    }
  } catch (statsErr) {
    console.error("[keepalive] stats snapshot failed:", statsErr);
  }

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    snapshots,
  });
}
