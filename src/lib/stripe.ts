import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export function generateLicenseKey(): string {
  const segment = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MF-${segment()}-${segment()}-${segment()}-${segment()}`;
}
