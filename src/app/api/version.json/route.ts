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

const VERSION      = "1.9.19";
const DOWNLOAD_URL = "https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.19/MotherFlame_v1.9.19.zip";
const SHA256       = "209C78D4B7353168A013D7301849FDC1B4903B4B9F996E678242815B9C6E3190";
const CHANGELOG    = [
  "Fix: some users got a crash on startup - SSL certificate verify failed",
  "The app now trusts both the Windows certificate store and its own bundled certificate list",
  "Crashes are now logged so problems can be diagnosed faster",
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
