import Link from "next/link";
import Image from "next/image";
import { Check, ChevronDown, Crown } from "lucide-react";
import { headers, cookies } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { AppShowcase } from "@/components/AppShowcase";
import { CheckoutButton } from "@/components/CheckoutButton";
import { CURRENCIES, getCurrency, type Currency } from "@/lib/currency";

// macOS build links.  Kept as constants because release.ps1 rewrites only the
// Windows href/size strings it knows about — the Mac ones are updated by hand,
// so they live in one obvious place instead of being buried twice in the JSX.
const MAC_VERSION = "1.9.20";
const MAC_DMG_URL =
  `https://github.com/vivrecard-ops/motherflame-releases/releases/download/v${MAC_VERSION}/MotherFlame-mac-${MAC_VERSION}.dmg`;
const MAC_ZIP_URL =
  `https://github.com/vivrecard-ops/motherflame-releases/releases/download/v${MAC_VERSION}/MotherFlame-mac-${MAC_VERSION}.zip`;

async function detectCurrency(): Promise<Currency> {
  const h = await headers();
  const fromHeader = h.get("x-currency");
  if (fromHeader === "EUR" || fromHeader === "USD") return fromHeader;

  const c = await cookies();
  const fromCookie = c.get("mf-currency")?.value;
  if (fromCookie === "EUR" || fromCookie === "USD") return fromCookie;

  const country = h.get("x-vercel-ip-country");
  return getCurrency(country);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const [dict, currency] = await Promise.all([getDictionary(lang), detectCurrency()]);
  const cur = CURRENCIES[currency];
  const period = lang === "fr" ? cur.period_fr : cur.period_en;
  const p = dict.pricing;

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-fuchsia-900/20 blur-3xl" />
        </div>

        {/* Background app screenshots — desktop only */}
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
          <div
            className="absolute -left-16 top-[12%] w-[520px] -rotate-6 overflow-hidden rounded-2xl opacity-30"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%, black 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 38%, black 100%)",
            }}
          >
            <Image src="/matchups.png" alt="" width={1307} height={860} className="w-full" />
          </div>

          <div
            className="absolute -right-16 top-[18%] w-[520px] rotate-6 overflow-hidden rounded-2xl opacity-30"
            style={{
              WebkitMaskImage: "linear-gradient(to left, transparent 0%, black 38%, black 100%)",
              maskImage: "linear-gradient(to left, transparent 0%, black 38%, black 100%)",
            }}
          >
            <Image src="/meta.jpg" alt="" width={1307} height={860} className="w-full" />
          </div>

          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 75% 80% at 50% 50%, transparent 10%, rgba(0,0,0,0.55) 60%, black 90%)",
            }}
          />
        </div>

        <div className="relative flex flex-col items-center gap-6">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
            {dict.hero.badge}
          </span>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="block text-white">{dict.hero.title}</span>
            <span className="block bg-gradient-to-br from-fuchsia-400 via-pink-500 to-rose-400 bg-clip-text text-transparent">
              {dict.hero.titleAccent}
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-zinc-400">
            {dict.hero.subtitle}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <a
                href="https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.20/MotherFlame_Setup_v1.9.20.exe"
                download
                className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                {dict.hero.downloadCta}
              </a>
              <span className="text-xs text-zinc-500">{dict.hero.downloadNote}</span>
            </div>

            {/* Mac — peer of the Windows button, same visual weight: the
                visitor picks by their own OS, not by which one we promote. */}
            <div className="flex flex-col items-center gap-1.5">
              <a
                href={MAC_DMG_URL}
                download
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.365 1.43c0 1.14-.47 2.24-1.23 3.04-.82.87-2.16 1.54-3.27 1.45-.13-1.09.42-2.25 1.15-3.02.82-.87 2.26-1.51 3.35-1.47zM20.7 17.1c-.56 1.29-.83 1.87-1.55 3.01-1 1.6-2.42 3.59-4.18 3.6-1.56.02-1.96-1.02-4.08-1.01-2.12.01-2.56 1.03-4.12 1.01-1.76-.01-3.1-1.81-4.1-3.4-2.8-4.47-3.1-9.72-1.37-12.51 1.23-1.98 3.17-3.14 5-3.14 1.86 0 3.03 1.02 4.57 1.02 1.49 0 2.4-1.02 4.55-1.02 1.63 0 3.35.89 4.58 2.42-4.02 2.2-3.37 7.94.7 10.02z"/>
                </svg>
                {dict.download.macCta}
              </a>
              <span className="text-xs text-zinc-500">
                {dict.download.macNote}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <a
                href="#pricing"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-7 text-sm font-semibold text-white shadow-lg shadow-pink-900/30 transition hover:from-pink-400 hover:to-rose-400"
              >
                <Crown size={15} />
                {dict.hero.pricingCta}
              </a>
              <span className="text-xs text-zinc-500">{dict.hero.pricingNote}</span>
            </div>
          </div>
        </div>

        <a
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-zinc-600 transition hover:text-zinc-400"
          aria-label="Scroll down"
        >
          <ChevronDown size={28} />
        </a>

        <div className="relative mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
          <span>
            <strong className="text-white">1,063,064+</strong>{" "}
            {dict.stats.matches}
          </span>
          <span className="hidden sm:block text-zinc-700">·</span>
          <span className="text-emerald-400">{dict.stats.free}</span>
          <span className="hidden sm:block text-zinc-700">·</span>
          <span>{dict.stats.platform}</span>
        </div>
      </section>

      {/* FEATURES WITH ALTERNATING SCREENSHOTS */}
      <AppShowcase lang={lang} dict={dict} />

      {/* PRICING */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{p.title}</h2>
            <p className="mt-4 text-zinc-400">{p.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* FREE CARD */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <div className="mb-6">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {p.freeTitle}
                </span>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{cur.symbol}0</span>
                  <span className="mb-1 text-zinc-500">{period}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {p.freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#download"
                className="mt-8 flex h-11 w-full items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                {dict.nav.download}
              </a>
            </div>

            {/* PREMIUM CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/60 via-zinc-950 to-zinc-950 p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-600/10 blur-3xl" />
              <div className="relative">
                <div className="mb-6">
                  <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-300">
                    {p.planName}
                  </span>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">
                      {cur.symbol}{cur.amount}
                    </span>
                    <span className="mb-1 text-zinc-500">{period}</span>
                  </div>
                  <span className="mt-1 inline-block rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-500">
                    {currency}
                  </span>
                </div>

                <ul className="flex flex-col gap-3">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check size={16} className="mt-0.5 shrink-0 text-fuchsia-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <CheckoutButton currency={currency} label={p.cta} lang={lang} />
                <p className="mt-3 text-center text-xs text-zinc-600">{p.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {dict.download.title}
          </h2>
          <p className="mt-4 text-zinc-400">{dict.download.subtitle}</p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
              <div className="flex flex-col items-center gap-2">
                <a
                  href="https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.20/MotherFlame_Setup_v1.9.20.exe"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-10 text-base font-semibold text-black transition hover:bg-zinc-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 16l-5-5 1.41-1.41L11 13.17V4h2v9.17l2.59-2.58L17 11l-5 5zm-6 2h12v2H6v-2z"/>
                  </svg>
                  {dict.download.cta}
                </a>
              </div>

              <div className="flex flex-col items-center gap-2">
                <a
                  href={MAC_DMG_URL}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-10 text-base font-semibold text-black transition hover:bg-zinc-100"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16.365 1.43c0 1.14-.47 2.24-1.23 3.04-.82.87-2.16 1.54-3.27 1.45-.13-1.09.42-2.25 1.15-3.02.82-.87 2.26-1.51 3.35-1.47zM20.7 17.1c-.56 1.29-.83 1.87-1.55 3.01-1 1.6-2.42 3.59-4.18 3.6-1.56.02-1.96-1.02-4.08-1.01-2.12.01-2.56 1.03-4.12 1.01-1.76-.01-3.1-1.81-4.1-3.4-2.8-4.47-3.1-9.72-1.37-12.51 1.23-1.98 3.17-3.14 5-3.14 1.86 0 3.03 1.02 4.57 1.02 1.49 0 2.4-1.02 4.55-1.02 1.63 0 3.35.89 4.58 2.42-4.02 2.2-3.37 7.94.7 10.02z"/>
                  </svg>
                  {dict.download.macCta}
                </a>
                <span className="text-xs text-zinc-600">
                  v{MAC_VERSION} · 150 MB · .dmg
                </span>
                <a
                  href={MAC_ZIP_URL}
                  className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  {dict.download.macAltCta}
                </a>
              </div>
            </div>
            <span className="text-xs text-zinc-600">v1.9.20 · 68 MB · .exe</span>
            <a
              href="https://github.com/vivrecard-ops/motherflame-releases/releases/download/v1.9.20/MotherFlame_v1.9.20.zip"
              className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              {dict.download.altCta}
            </a>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-600">
            <Check size={14} className="text-emerald-500" />
            {dict.download.note}
          </p>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <h3 className="text-sm font-semibold text-zinc-200">
              {dict.download.stepsTitle}
            </h3>
            <ol className="mt-4 space-y-3">
              {dict.download.steps.map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-white/10 pt-4 text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">
                {dict.download.smartscreenTitle}
              </span>{" "}
              {dict.download.smartscreenBody}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
