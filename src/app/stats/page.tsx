import { notFound } from "next/navigation";
import { supabaseAdmin as _supabaseAdmin } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin = _supabaseAdmin as any;

// Always fresh — this is a live dashboard, never a cached build artifact.
export const dynamic = "force-dynamic";

type Platform = "windows" | "mac";

/**
 * Map a download_stats.asset value to (platform, isInstaller).
 *
 * /api/keepalive writes "windows_installer" / "windows_zip" / "mac_installer"
 * / "mac_zip" going forward.  Rows snapshotted before the Mac build existed
 * used the un-qualified "installer" / "zip" — those all predate any Mac
 * release, so they can only ever mean Windows.
 */
function classify(asset: string): { platform: Platform; installer: boolean } | null {
  if (asset === "installer") return { platform: "windows", installer: true };
  if (asset === "zip") return { platform: "windows", installer: false };
  if (asset === "windows_installer") return { platform: "windows", installer: true };
  if (asset === "windows_zip") return { platform: "windows", installer: false };
  if (asset === "mac_installer") return { platform: "mac", installer: true };
  if (asset === "mac_zip") return { platform: "mac", installer: false };
  return null;
}

/**
 * GET /stats?k=<STATS_SECRET>
 *
 * Private growth dashboard for the owner: download counts (snapshotted daily
 * into download_stats by /api/keepalive) and active licenses. Not linked
 * anywhere; access requires the STATS_SECRET query key. Wrong or missing
 * key → 404 so the page's existence isn't advertised.
 */
export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;
  const secret = process.env.STATS_SECRET;
  if (!secret || k !== secret) notFound();

  // Fetch in pages, bounded to a recent window.
  //
  // Supabase enforces a server-side cap of 1000 rows per request that no
  // client-side .limit() or Range header can raise. The snapshot writes one
  // row per asset per version per day, so each release widens a day by 4 rows
  // and the table crossed 1000 after ~25 days. Past that the newest day came
  // back truncated mid-way through its rows and the page summed the fragment:
  // Windows read "4" because only 5 of ~20 versions' installer rows arrived.
  // So: page through explicitly, and bound by date so the number of pages
  // stays flat as the table keeps growing.
  const WINDOW_DAYS = 45;
  const PAGE = 1000;
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const rows: Array<Record<string, unknown>> = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabaseAdmin
      .from("download_stats")
      .select("snapshot_date, version, asset, downloads")
      .gte("snapshot_date", since)
      .order("snapshot_date", { ascending: true })
      .order("version", { ascending: true })
      .order("asset", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[stats] download_stats page failed", error);
      break;
    }
    if (!page?.length) break;
    rows.push(...page);
    if (page.length < PAGE) break;   // last page
    if (from > 200_000) break;       // hard stop; never loop forever
  }

  // Licence counts, separated because they answer different questions.
  // "active" in our table means "has access"; it deliberately includes the
  // comp keys we issued by hand (no Stripe subscription), which are not
  // customers and must not be read as revenue.
  const { data: licRows } = await supabaseAdmin
    .from("licenses")
    .select("status, stripe_subscription_id")
    .limit(10_000);

  type Lic = { status: string; stripe_subscription_id: string | null };
  const lics = (licRows ?? []) as Lic[];
  const activeLicenses = lics.filter((l) => l.status === "active").length;
  const compLicenses = lics.filter(
    (l) => l.status === "active" && !l.stripe_subscription_id,
  ).length;
  const dbPaying = activeLicenses - compLicenses;

  // Ground truth for "how many people are actually paying" comes from Stripe,
  // not from our mirror of it: our status only changes when a webhook lands,
  // so a missed or failed delivery leaves a cancelled subscriber marked active
  // for good (the current_period_end fallback can't catch it either — Stripe's
  // 2026 API moved that field and we store null). One list call covers every
  // customer, so this stays a single request no matter how many subscribers
  // there are. Read-only on purpose: this reports drift, it never rewrites
  // licence rows, because wrongly flipping one would revoke a paying user.
  let stripePaying: number | null = null;
  try {
    const { stripe } = await import("@/lib/stripe");
    const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
    stripePaying = subs.data.length;
  } catch (err) {
    console.error("[stats] Stripe subscription count failed", err);
  }

  type Row = {
    snapshot_date: string;
    version: string;
    asset: string;
    downloads: number;
  };
  const stats = (rows ?? []) as Row[];

  // Per-day installer totals, split by platform.
  //
  // The legacy key ("installer") and the platform-qualified key
  // ("windows_installer") can both exist for the SAME (date, version): the
  // day this split shipped, the 3am cron ran under the old code before
  // deploy, then a later run wrote the new key for that same day. Naively
  // summing every matching row double-counts that day. Fix: collapse to at
  // most one count per (date, version, platform, installer|zip) — preferring
  // the platform-qualified key when both are present, since it is the one
  // going forward.
  const bestCount = new Map<string, number>();
  const keyPriority = new Map<string, number>();
  for (const r of stats) {
    const c = classify(r.asset);
    if (!c) continue;
    const dedupeKey = `${r.snapshot_date}|${r.version}|${c.platform}|${c.installer}`;
    const priority = r.asset === "installer" || r.asset === "zip" ? 0 : 1;
    if (!keyPriority.has(dedupeKey) || priority >= keyPriority.get(dedupeKey)!) {
      keyPriority.set(dedupeKey, priority);
      bestCount.set(dedupeKey, r.downloads);
    }
  }

  const byDay: Record<Platform, Map<string, number>> = {
    windows: new Map(),
    mac: new Map(),
  };
  for (const [dedupeKey, downloads] of bestCount) {
    const [date, , platform, installer] = dedupeKey.split("|");
    if (installer !== "true") continue;
    const m = byDay[platform as Platform];
    m.set(date, (m.get(date) ?? 0) + downloads);
  }

  const allDates = [
    ...new Set([...byDay.windows.keys(), ...byDay.mac.keys()]),
  ].sort();

  // Carry the last known total forward onto dates where a platform has no
  // row yet (e.g. Mac has no snapshot before its first release date).
  function series(platform: Platform) {
    let last = 0;
    return allDates.map((d) => {
      const v = byDay[platform].get(d);
      if (v !== undefined) last = v;
      return last;
    });
  }
  const winSeries = series("windows");
  const macSeries = series("mac");

  const winTotal = winSeries.length ? winSeries[winSeries.length - 1] : 0;
  const macTotal = macSeries.length ? macSeries[macSeries.length - 1] : 0;

  function deltas(s: number[]) {
    return s.slice(1).map((v, i) => Math.max(0, v - s[i]));
  }
  const winDeltas = deltas(winSeries);
  const macDeltas = deltas(macSeries);
  const winToday = winDeltas.length ? winDeltas[winDeltas.length - 1] : null;
  const macToday = macDeltas.length ? macDeltas[macDeltas.length - 1] : null;

  // Per-version installer counts for the latest snapshot date, deduped the
  // same way as byDay above (one row per version+platform, not per asset key).
  const latestDate = allDates.length ? allDates[allDates.length - 1] : null;
  const perVersionMap = new Map<
    string,
    { version: string; platform: Platform; downloads: number; priority: number }
  >();
  for (const r of stats) {
    if (r.snapshot_date !== latestDate) continue;
    const c = classify(r.asset);
    if (!c?.installer) continue;
    const dedupeKey = `${r.version}|${c.platform}`;
    const priority = r.asset === "installer" ? 0 : 1;
    const existing = perVersionMap.get(dedupeKey);
    if (!existing || priority >= existing.priority) {
      perVersionMap.set(dedupeKey, { version: r.version, platform: c.platform, downloads: r.downloads, priority });
    }
  }
  const perVersion = [...perVersionMap.values()]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 8);

  // Simple inline SVG: two cumulative lines (Windows, Mac) over shared days.
  const W = 640;
  const H = 200;
  const PAD = 30;
  const maxY = Math.max(winTotal, macTotal, 10);
  function toPoints(s: number[]) {
    return s.map((v, i) => {
      const x =
        allDates.length === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (allDates.length - 1);
      const y = H - PAD - (v / maxY) * (H - 2 * PAD);
      return { x, y };
    });
  }
  const winPts = toPoints(winSeries);
  const macPts = toPoints(macSeries);
  const winLine = winPts.map((p) => `${p.x},${p.y}`).join(" ");
  const macLine = macPts.map((p) => `${p.x},${p.y}`).join(" ");
  const hasMacData = macTotal > 0 || byDay.mac.size > 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold text-white">MotherFlame — stats</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Mis à jour chaque nuit à 3h (+ à chaque visite pour les licences)
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">🪟 Windows — total</p>
          <p className="mt-1 text-2xl font-bold text-white">{winTotal}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {winToday === null ? "—" : `+${winToday} aujourd'hui`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">🍎 Mac — total</p>
          <p className="mt-1 text-2xl font-bold text-white">{macTotal}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {macToday === null ? "—" : `+${macToday} aujourd'hui`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">Abonnés payants</p>
          <p className="mt-1 text-2xl font-bold text-fuchsia-400">
            {stripePaying ?? dbPaying}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {stripePaying === null ? "d'après la base" : "d'après Stripe"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">Accès totaux</p>
          <p className="mt-1 text-2xl font-bold text-white">{activeLicenses}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            dont {compLicenses} offerte{compLicenses > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Surfaced rather than silently reconciled: a gap means a webhook did
          not land, and the fix is to look at Stripe's delivery log — not to
          have this page quietly rewrite licence rows. */}
      {stripePaying !== null && stripePaying !== dbPaying && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-300">
            Écart détecté : Stripe compte {stripePaying} abonnement
            {stripePaying > 1 ? "s" : ""} actif{stripePaying > 1 ? "s" : ""}, la
            base en marque {dbPaying}.
          </p>
          <p className="mt-1 text-xs text-amber-300/70">
            {dbPaying > stripePaying
              ? "Des licences restent actives alors que l'abonnement a pris fin — un webhook Stripe n'est probablement pas arrivé."
              : "Des abonnements payants n'ont pas de licence active — vérifiez les webhooks récents."}
          </p>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Installations cumulées</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400" />
              Windows
            </span>
            {hasMacData && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                Mac
              </span>
            )}
          </div>
        </div>
        {allDates.length < 2 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            La courbe apparaîtra à partir du 2ᵉ jour de données — le cron
            enregistre un point chaque nuit.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Courbe des installations cumulées, Windows et Mac"
          >
            <polyline points={winLine} fill="none" stroke="#e879f9" strokeWidth="2" />
            {hasMacData && (
              <polyline points={macLine} fill="none" stroke="#38bdf8" strokeWidth="2" />
            )}
            {winPts.map((p, i) => (
              <g key={`w-${i}`}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#e879f9" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill="#a1a1aa">
                  {winSeries[i]}
                </text>
                <text x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="#71717a">
                  {allDates[i].slice(5)}
                </text>
              </g>
            ))}
            {hasMacData &&
              macPts.map((p, i) => (
                <g key={`m-${i}`}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#38bdf8" />
                  {macSeries[i] > 0 && (
                    <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize="11" fill="#7dd3fc">
                      {macSeries[i]}
                    </text>
                  )}
                </g>
              ))}
          </svg>
        )}
      </div>

      {winDeltas.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs text-zinc-500">
            Nouvelles installations par jour — 🪟 Windows / 🍎 Mac
          </p>
          <div className="flex flex-col gap-2">
            {allDates
              .slice(1)
              .map((d, i) => ({ date: d, win: winDeltas[i], mac: macDeltas[i] ?? 0 }))
              .slice(-14)
              .reverse()
              .map((d) => {
                const maxDelta = Math.max(...winDeltas, ...macDeltas, 1);
                return (
                  <div key={d.date} className="flex items-center gap-3 text-sm">
                    <span className="w-16 shrink-0 text-zinc-500">{d.date.slice(5)}</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3.5 rounded bg-fuchsia-500/70"
                          style={{
                            width: `${Math.min(100, (d.win / maxDelta) * 100)}%`,
                            minWidth: d.win > 0 ? "4px" : "0",
                          }}
                        />
                        <span className="text-xs text-zinc-400">+{d.win}</span>
                      </div>
                      {hasMacData && (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3.5 rounded bg-sky-500/70"
                            style={{
                              width: `${Math.min(100, (d.mac / maxDelta) * 100)}%`,
                              minWidth: d.mac > 0 ? "4px" : "0",
                            }}
                          />
                          <span className="text-xs text-zinc-400">+{d.mac}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-xs text-zinc-500">Par version</p>
        <div className="flex flex-col gap-1.5">
          {perVersion.map((r) => (
            <div key={r.platform + r.version} className="flex justify-between text-sm text-zinc-300">
              <span>
                {r.platform === "mac" ? "🍎" : "🪟"} {r.version}
              </span>
              <span className="font-semibold text-white">{r.downloads}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
