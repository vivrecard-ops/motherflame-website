import { NextResponse, type NextRequest } from "next/server";
import { stripe, generateLicenseKey } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendLicenseEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[webhook] signature error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!email) break;

        // Fetch subscription to get period end (may be null in test fixtures)
        let periodEnd: string | null = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const raw = (subscription as Record<string, unknown>).current_period_end;
            periodEnd =
              typeof raw === "number" && raw > 0
                ? new Date(raw * 1000).toISOString()
                : null;
          } catch {
            // subscription not available, period_end stays null
          }
        }

        const licenseKey = generateLicenseKey();

        await supabaseAdmin.from("licenses").insert({
          license_key: licenseKey,
          email,
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
          status: "active",
          current_period_end: periodEnd,
        });

        await sendLicenseEmail(email, licenseKey);

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status =
          sub.status === "active"
            ? "active"
            : sub.status === "past_due"
              ? "past_due"
              : sub.status === "canceled"
                ? "cancelled"
                : "expired";

        const rawEnd = (sub as Record<string, unknown>).current_period_end;
        await supabaseAdmin
          .from("licenses")
          .update({
            status,
            current_period_end:
              typeof rawEnd === "number" && rawEnd > 0
                ? new Date(rawEnd * 1000).toISOString()
                : null,
          })
          .eq("stripe_subscription_id", sub.id);

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("licenses")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", sub.id);

        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
