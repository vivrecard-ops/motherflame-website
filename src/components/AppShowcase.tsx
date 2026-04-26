import Image from "next/image";
import Link from "next/link";
import { BarChart3, ScrollText, Grid3x3, Crown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const iconMap = {
  "bar-chart": BarChart3,
  scroll: ScrollText,
  grid: Grid3x3,
  crown: Crown,
};

const screenshots: { file: string; ext: string }[] = [
  { file: "overview", ext: "png" },
  { file: "history",  ext: "png" },
  { file: "matchups", ext: "png" },
  { file: "meta",     ext: "jpg" },
];

interface Props {
  lang: Locale;
  dict: Dictionary;
}

export function AppShowcase({ lang, dict }: Props) {
  const isPremium = (badge: string) => badge === "Meta" || badge === "Méta";

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {dict.features.title}
          </h2>
          <p className="mt-3 text-zinc-400">{dict.features.subtitle}</p>
        </div>

        <div className="flex flex-col gap-28">
          {dict.features.items.map((feature, i) => {
            const shot = screenshots[i];
            const Icon = iconMap[feature.icon as keyof typeof iconMap] ?? BarChart3;
            const premium = isPremium(feature.badge);
            const imageLeft = i % 2 === 0;

            return (
              <div
                key={feature.title}
                className={`flex flex-col items-center gap-12 lg:flex-row ${
                  imageLeft ? "" : "lg:flex-row-reverse"
                }`}
              >
                {/* Screenshot */}
                <div className="w-full lg:w-3/5">
                  <div
                    className={`overflow-hidden rounded-2xl border shadow-2xl ${
                      premium
                        ? "border-fuchsia-500/25 shadow-fuchsia-950/40"
                        : "border-white/8 shadow-black/40"
                    }`}
                  >
                    <Image
                      src={`/${shot.file}.${shot.ext}`}
                      alt={feature.title}
                      width={1307}
                      height={860}
                      className="w-full"
                      quality={90}
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="flex w-full flex-col gap-5 lg:w-2/5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        premium
                          ? "bg-fuchsia-500/15 text-fuchsia-400"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        premium
                          ? "bg-fuchsia-500/20 text-fuchsia-300"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    {feature.title}
                  </h3>

                  <p className="text-base leading-relaxed text-zinc-400">
                    {feature.description}
                  </p>

                  {premium && (
                    <Link
                      href="#pricing"
                      className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-900/30 transition hover:from-pink-400 hover:to-rose-400"
                    >
                      {dict.metaTeaser.cta} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
