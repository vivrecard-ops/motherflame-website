import "../globals.css";

export const metadata = {
  title: "MotherFlame — stats",
  robots: { index: false, follow: false },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
