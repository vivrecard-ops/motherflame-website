import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { checkCheckoutRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Per-IP rate limit — each successful call creates a Stripe Checkout
  // session, so without this a script could spam session creation.
  const rl = await checkCheckoutRateLimit(request);
  if (rl.rateLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status:  429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  try {
    const { currency, lang } = await request.json();

    const priceId =
      currency === "USD"
        ? process.env.STRIPE_PRICE_ID_USD!
        : process.env.STRIPE_PRICE_ID_EUR!;

    // Whitelist the locale — it lands in a redirect URL, so never interpolate
    // arbitrary client input.
    const locale = lang === "fr" ? "fr" : "en";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/${locale}?checkout=success`,
      cancel_url: `${baseUrl}/${locale}#pricing`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
