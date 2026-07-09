import Stripe from "stripe";
import { randomInt } from "crypto";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// License keys are bearer secrets — they must come from a CSPRNG.
// crypto.randomInt is unbiased (rejection sampling), unlike Math.random()
// which is predictable and unsuitable for anything security-sensitive.
const KEY_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateLicenseKey(): string {
  const segment = () =>
    Array.from(
      { length: 4 },
      () => KEY_ALPHABET[randomInt(KEY_ALPHABET.length)],
    ).join("");
  return `MF-${segment()}-${segment()}-${segment()}-${segment()}`;
}
