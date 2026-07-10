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

const VERSION      = "1.9.18";
const DOWNLOAD_URL = "https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.18/MotherFlame_v1.9.18.zip";
const SHA256       = "1FA351426BBE36C405EDAF54030040F913940891217B3CA9AC4B5DA72BA57537";
const CHANGELOG    = [
  "Fix: matches were no longer tracked since simulator 1.41 (the game changed its log format)",
  "New fallback reads the result from the saved combat log itself - future simulator wording changes will not break tracking",
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
