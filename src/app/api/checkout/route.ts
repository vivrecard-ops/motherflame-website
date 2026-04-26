import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { currency } = await request.json();

    const priceId =
      currency === "USD"
        ? process.env.STRIPE_PRICE_ID_USD!
        : process.env.STRIPE_PRICE_ID_EUR!;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/en?checkout=success`,
      cancel_url: `${baseUrl}/en#pricing`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
