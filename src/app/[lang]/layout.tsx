import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!locales.includes(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    metadataBase: new URL("https://optcg-motherflame.net"),
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: "MotherFlame",
      locale: lang === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!locales.includes(lang as Locale)) notFound();

  const dict = await getDictionary(lang as Locale);

  return (
    <html lang={lang} className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Navbar lang={lang as Locale} dict={dict} />
        <main className="pt-14">{children}</main>
        <Footer lang={lang as Locale} dict={dict} />
      </body>
    </html>
  );
}
