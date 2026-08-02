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

const VERSION      = "1.9.20";
const DOWNLOAD_URL = "https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.20/MotherFlame_v1.9.20.zip";
const SHA256       = "FF39D94D15A71F0893D8F5094CF5E4323D30E74F8EAE6FA28F896B5990B89852";
const CHANGELOG    = [
  "Fix: app could crash on first launch on some PCs - SSL certificate error",
  "The display client is now used directly from the app instead of being downloaded on first launch",
  "Faster first start and works offline",
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
