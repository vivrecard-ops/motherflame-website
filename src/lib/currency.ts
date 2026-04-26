export const CURRENCIES = {
  EUR: { symbol: "€", amount: "3.99", display: "€3.99", period_en: "/month", period_fr: "/mois" },
  USD: { symbol: "$", amount: "4.99", display: "$4.99", period_en: "/month", period_fr: "/month" },
} as const;

export type Currency = keyof typeof CURRENCIES;

// EU + EEA country codes → EUR
const EUR_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES",
  "SE","NO","IS","LI","CH", // EEA + Switzerland
]);

export function getCurrency(country: string | null): Currency {
  if (!country) return "EUR";
  if (country === "US") return "USD";
  if (EUR_COUNTRIES.has(country)) return "EUR";
  return "EUR"; // default for the rest of the world
}
