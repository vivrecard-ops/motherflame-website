import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin as _supabaseAdmin } from "@/lib/supabase/admin";
import { checkPortalRateLimit } from "@/lib/rate-limit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin = _supabaseAdmin as any;

/**
 * POST /api/billing-portal
 *
 * Body: { license_key: string }
 *
 * Looks up the Stripe customer associated with the license key and creates a
 * Stripe Billing Portal session.  Returns { url } — the caller opens it in a
 * browser.  The portal lets the customer cancel, update payment method, and
 * view invoices without any account on our side.
 *
 * Requires the Stripe Customer Portal to be configured in:
 *   Stripe Dashboard → Settings → Billing → Customer portal
 */
export async function POST(request: NextRequest) {
  // Per-IP rate limit BEFORE reading the body.  This endpoint reaches Stripe
  // (paid API) on every successful call — without rate limiting, an attacker
  // could rack up Stripe charges + spam our customer accounts.  Also blocks
  // license-key enumeration via the "License not found" error path.
  const rl = await checkPortalRateLimit(request);
  if (rl.rateLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
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
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!licenseKey || typeof licenseKey !== "string") {
    return NextResponse.json(
      { error: "Missing license_key" },
      { status: 400 },
    );
  }

  try {
    // Retrieve the Stripe customer ID linked to this license key.
    const { data, error } = await supabaseAdmin
      .from("licenses")
      .select("stripe_customer_id, status")
      .eq("license_key", licenseKey.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("[billing-portal] db error", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "License not found" },
        { status: 404 },
      );
    }

    if (!data.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer associated with this license" },
        { status: 404 },
      );
    }

    // Create a short-lived Stripe Billing Portal session.
    // The customer is taken directly to their subscription management page.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://optcg-motherflame.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: baseUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing-portal] handler error", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}
