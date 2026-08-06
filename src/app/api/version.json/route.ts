import { NextResponse } from "next/server";

/**
 * GET /api/version.json
 *
 * Returns the latest available version of the MotherFlame desktop app.
 * The auto-updater (optcg_tracker/update/updater.py) polls this endpoint
 * on every startup to check whether a newer build is available.
 *
 * ── How to release a new version ────────────────────────────────────────────
 * 1. Build the new dist zip (PyInstaller / Nuitka).
 * 2. Upload the zip somewhere publicly downloadable (GitHub Releases, etc.).
 * 3. Compute the SHA-256 of the zip:
 *      PowerShell:  (Get-FileHash .\MotherFlame_vX.Y.Z.zip -Algorithm SHA256).Hash
 *      bash:        sha256sum MotherFlame_vX.Y.Z.zip
 * 4. Update VERSION, DOWNLOAD_URL, and SHA256 below.
 * 5. Push → Vercel redeploys automatically.
 *
 * The updater compares the remote version string with the local version.txt.
 * If remote > local, it downloads the zip, verifies SHA-256, and applies.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Update these three values on every release ───────────────────────────────

const VERSION      = "1.9.21";
const DOWNLOAD_URL = "https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.21/MotherFlame_v1.9.21.zip";
const SHA256       = "949160E06062D3F7BCC828475ED43353613D1060633C43B41D8F1FEF37D2C99F";
const CHANGELOG    = [
  "Fix: the Meta tab showed outdated decklists - it now refreshes daily like the win rates",
  "Fix: in rare cases only the overlay opened without the dashboard - the app now reports the error instead of hanging",
];

// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json(
    {
      version:   VERSION,
      url:       DOWNLOAD_URL,
      sha256:    SHA256,
      changelog: CHANGELOG,
    },
    {
      headers: {
        // Allow the desktop app to fetch this from any origin.
        "Access-Control-Allow-Origin": "*",
        // Cache for 5 minutes — short enough to deliver updates promptly,
        // long enough to not hammer the serverless function on every startup.
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    },
  );
}
