import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LangSwitcher } from "./LangSwitcher";

export function Navbar({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <Image src="/logo.svg" alt="MotherFlame logo" width={22} height={26} />
          <span className="font-semibold tracking-tight text-white">
            MotherFlame
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
          <Link href={`/${lang}#features`} className="transition hover:text-white">
            {dict.nav.features}
          </Link>
          <Link href={`/${lang}#pricing`} className="transition hover:text-white">
            {dict.nav.pricing}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitcher currentLang={lang} />
          <Link
            href="#download"
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {dict.nav.download}
          </Link>
        </div>
      </div>
    </header>
  );
}
