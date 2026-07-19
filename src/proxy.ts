import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { getCurrency } from "@/lib/currency";

function pickLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase())
    .find((lang) => locales.some((loc) => lang.startsWith(loc)));

  if (preferred) {
    const match = locales.find((loc) => preferred.startsWith(loc));
    if (match) return match;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country"); // set by Vercel in prod
  const currency = getCurrency(country);

  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );

  // Forward currency to Server Components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-currency", currency);

  if (!hasLocale) {
    const locale = pickLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.redirect(url);
    res.cookies.set("mf-currency", currency, { path: "/", maxAge: 86400 });
    return res;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|stats|_next|.*\\..*).*)"],
};
