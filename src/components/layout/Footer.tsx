import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-white/5 bg-black px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <Link href={`/${lang}`} className="flex items-center gap-2">
              <Image src="/logo.svg" alt="MotherFlame logo" width={18} height={22} />
              <span className="font-semibold text-white">
                MotherFlame
              </span>
            </Link>
            <p className="text-sm text-zinc-600">{dict.footer.tagline}</p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
            <Link href={`/${lang}/pricing`} className="transition hover:text-white">
              {dict.footer.links.pricing}
            </Link>
            <Link href="#download" className="transition hover:text-white">
              {dict.footer.links.download}
            </Link>
            <a href="mailto:support@optcg-motherflame.com" className="transition hover:text-white">
              {dict.footer.links.support}
            </a>
            <Link href={`/${lang}/privacy`} className="transition hover:text-white">
              {dict.footer.links.privacy}
            </Link>
            <Link href={`/${lang}/terms`} className="transition hover:text-white">
              {dict.footer.links.terms}
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8 text-xs text-zinc-700">
          © {new Date().getFullYear()} {dict.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
