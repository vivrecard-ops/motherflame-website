import { notFound } from "next/navigation";
import { supabaseAdmin as _supabaseAdmin } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin = _supabaseAdmin as any;

// Always fresh — this is a live dashboard, never a cached build artifact.
export const dynamic = "force-dynamic";

/**
 * GET /stats?k=<STATS_SECRET>
 *
 * Private growth dashboard for the owner: download counts (snapshotted daily
 * into download_stats by /api/keepalive) and active licenses.  Not linked
 * anywhere; access requires the STATS_SECRET query key.  Wrong or missing
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

  const { data: rows } = await supabaseAdmin
    .from("download_stats")
    .select("snapshot_date, version, asset, downloads")
    .order("snapshot_date", { ascending: true });

  const { count: activeLicenses } = await supabaseAdmin
    .from("licenses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  type Row = {
    snapshot_date: string;
    version: string;
    asset: string;
    downloads: number;
  };
  const stats = (rows ?? []) as Row[];

  // Per-day totals for installer downloads (all versions summed).
  const byDay = new Map<string, number>();
  for (const r of stats) {
    if (r.asset !== "installer") continue;
    byDay.set(r.snapshot_date, (byDay.get(r.snapshot_date) ?? 0) + r.downloads);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const totalNow = days.length ? days[days.length - 1][1] : 0;

  // Daily deltas (new installs per day) — needs ≥2 snapshots.
  const deltas = days.slice(1).map(([date, total], i) => ({
    date,
    delta: Math.max(0, total - days[i][1]),
  }));
  const today = days.length ? days[days.length - 1][0] : null;
  const todayDelta = deltas.length ? deltas[deltas.length - 1].delta : null;

  // Latest per-version installer counts (top 5).
  const latestDate = today;
  const perVersion = stats
    .filter((r) => r.snapshot_date === latestDate && r.asset === "installer")
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5);

  // Simple inline SVG: cumulative line over snapshot days.
  const W = 640;
  const H = 200;
  const PAD = 30;
  const maxY = Math.max(totalNow, 10);
  const pts = days.map(([, total], i) => {
    const x =
      days.length === 1
        ? W / 2
        : PAD + (i * (W - 2 * PAD)) / (days.length - 1);
    const y = H - PAD - (total / maxY) * (H - 2 * PAD);
    return { x, y };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold text-white">MotherFlame — stats</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Mis à jour chaque nuit à 3h (+ à chaque visite pour les licences)
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">Installations totales</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalNow}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">Aujourd&apos;hui</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {todayDelta === null ? "—" : `+${todayDelta}`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">Licences actives</p>
          <p className="mt-1 text-2xl font-bold text-fuchsia-400">
            {activeLicenses ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-zinc-500">Jours de données</p>
          <p className="mt-1 text-2xl font-bold text-white">{days.length}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-xs text-zinc-500">
          Installations cumulées (.exe, toutes versions)
        </p>
        {days.length < 2 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            La courbe apparaîtra à partir du 2ᵉ jour de données — le cron
            enregistre un point chaque nuit.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Courbe des installations cumulées"
          >
            <polyline
              points={polyline}
              fill="none"
              stroke="#e879f9"
              strokeWidth="2"
            />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#e879f9" />
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#a1a1aa"
                >
                  {days[i][1]}
                </text>
                <text
                  x={p.x}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#71717a"
                >
                  {days[i][0].slice(5)}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>

      {deltas.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs text-zinc-500">
            Nouvelles installations par jour
          </p>
          <div className="flex flex-col gap-2">
            {deltas
              .slice(-14)
              .reverse()
              .map((d) => (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-zinc-500">
                    {d.date.slice(5)}
                  </span>
                  <div className="h-4 rounded bg-fuchsia-500/70"
                    style={{
                      width: `${Math.min(
                        100,
                        (d.delta /
                          Math.max(...deltas.map((x) => x.delta), 1)) *
                          100,
                      )}%`,
                      minWidth: d.delta > 0 ? "4px" : "0",
                    }}
                  />
                  <span className="text-zinc-300">+{d.delta}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-xs text-zinc-500">Par version (installeur)</p>
        <div className="flex flex-col gap-1.5">
          {perVersion.map((r) => (
            <div
              key={r.version}
              className="flex justify-between text-sm text-zinc-300"
            >
              <span>{r.version}</span>
              <span className="font-semibold text-white">{r.downloads}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
