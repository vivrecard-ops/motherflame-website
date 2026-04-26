"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

export function LangSwitcher({ currentLang }: { currentLang: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (lang: Locale) => {
    const segments = pathname.split("/");
    segments[1] = lang;
    router.push(segments.join("/") || "/");
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 px-1 py-0.5 text-xs font-medium">
      {locales.map((lang, i) => (
        <span key={lang} className="flex items-center gap-1">
          {i > 0 && <span className="text-white/20">|</span>}
          <button
            onClick={() => switchTo(lang)}
            className={
              lang === currentLang
                ? "text-white"
                : "text-zinc-500 transition hover:text-zinc-300"
            }
          >
            {lang.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
