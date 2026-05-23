import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, type Locale } from "@/i18n/config";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEN = lang === "en";
  return {
    title: isEN ? "Privacy Policy — MotherFlame" : "Politique de confidentialité — MotherFlame",
    description: isEN
      ? "How MotherFlame collects, uses, and protects your personal data."
      : "Comment MotherFlame collecte, utilise et protège vos données personnelles.",
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  await getDictionary(lang); // ensures lang is valid
  const isEN = lang === "en";

  const lastUpdated = "May 23, 2026";

  if (!isEN) {
    // ── FRENCH ───────────────────────────────────────────────────────────────
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link
          href={`/${lang}`}
          className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          ← Retour
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-white">
          Politique de confidentialité
        </h1>
        <p className="mb-12 text-sm text-zinc-500">Dernière mise à jour : {lastUpdated}</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-10 text-zinc-300 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-pink-400 [&_a]:underline-offset-2 [&_a:hover]:text-pink-300">

          <p>
            MotherFlame (<strong className="text-white">«&nbsp;nous&nbsp;»</strong>) exploite le site{" "}
            <a href="https://optcg-motherflame.com">optcg-motherflame.com</a> et l&apos;application de bureau MotherFlame.
            Cette politique explique quelles données nous collectons, pourquoi et comment nous les protégeons.
          </p>

          <section>
            <h2>1. Données collectées</h2>
            <p>
              <strong className="text-white">Lors d&apos;un abonnement :</strong> nous collectons votre adresse e-mail afin
              de vous envoyer votre clé de licence et d&apos;administrer votre abonnement.
              Les données de paiement (numéro de carte, etc.) sont traitées directement par{" "}
              <strong className="text-white">Stripe</strong> et ne transitent jamais par nos serveurs.
            </p>
            <p className="mt-3">
              <strong className="text-white">Dans l&apos;application :</strong> toutes vos données de parties (historique,
              statistiques, notes) sont stockées <strong className="text-white">localement sur votre appareil</strong>.
              Elles ne sont jamais transmises à nos serveurs.
            </p>
            <p className="mt-3">
              <strong className="text-white">Stats méta :</strong> l&apos;onglet Meta affiche des données agrégées et
              anonymisées provenant du simulateur OPTCGSim. Aucune donnée personnelle n&apos;est collectée via cet onglet.
            </p>
          </section>

          <section>
            <h2>2. Utilisation des données</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Envoyer votre clé de licence par e-mail</li>
              <li>Valider votre abonnement actif lors de l&apos;ouverture de l&apos;application</li>
              <li>Gérer les renouvellements et annulations via Stripe</li>
              <li>Répondre à vos demandes de support</li>
            </ul>
            <p className="mt-3">Nous ne vendons, ne louons et ne partageons jamais vos données avec des tiers à des fins commerciales.</p>
          </section>

          <section>
            <h2>3. Services tiers</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong className="text-white">Stripe</strong> — traitement des paiements.{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité Stripe ↗
                </a>
              </li>
              <li>
                <strong className="text-white">Supabase</strong> — stockage sécurisé des clés de licence et des e-mails.{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité Supabase ↗
                </a>
              </li>
              <li>
                <strong className="text-white">Resend</strong> — envoi des e-mails de licence.{" "}
                <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité Resend ↗
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Conservation des données</h2>
            <p>
              Nous conservons votre adresse e-mail et votre clé de licence aussi longtemps que votre abonnement est actif,
              puis pendant 12 mois après sa résiliation à des fins de support.
              Vous pouvez demander la suppression à tout moment.
            </p>
          </section>

          <section>
            <h2>5. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
              de suppression et de portabilité de vos données. Pour exercer ces droits,
              contactez-nous à{" "}
              <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>.
            </p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>
              Le site n&apos;utilise pas de cookies de traçage ou publicitaires.
              Des cookies techniques strictement nécessaires au fonctionnement peuvent être présents
              (session Stripe lors du paiement).
            </p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p>
              Pour toute question concernant cette politique :{" "}
              <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>
            </p>
          </section>
        </div>
      </div>
    );
  }

  // ── ENGLISH ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href={`/${lang}`}
        className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
      >
        ← Back
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-12 text-sm text-zinc-500">Last updated: {lastUpdated}</p>

      <div className="prose prose-invert prose-zinc max-w-none space-y-10 text-zinc-300 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-pink-400 [&_a]:underline-offset-2 [&_a:hover]:text-pink-300">

        <p>
          MotherFlame (<strong className="text-white">&ldquo;we&rdquo;</strong>) operates the website{" "}
          <a href="https://optcg-motherflame.com">optcg-motherflame.com</a> and the MotherFlame desktop application.
          This policy explains what data we collect, why, and how we protect it.
        </p>

        <section>
          <h2>1. Data We Collect</h2>
          <p>
            <strong className="text-white">When you subscribe:</strong> we collect your email address to send you
            your license key and manage your subscription.
            Payment data (card numbers, etc.) is processed directly by{" "}
            <strong className="text-white">Stripe</strong> and never touches our servers.
          </p>
          <p className="mt-3">
            <strong className="text-white">In the app:</strong> all your match data (history, statistics, notes)
            is stored <strong className="text-white">locally on your device</strong>.
            It is never transmitted to our servers.
          </p>
          <p className="mt-3">
            <strong className="text-white">Meta stats:</strong> the Meta tab displays aggregated, anonymous data
            from the OPTCGSim simulator. No personal data is collected through this feature.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Send your license key by email</li>
            <li>Validate your active subscription when you open the app</li>
            <li>Handle renewals and cancellations via Stripe</li>
            <li>Respond to your support requests</li>
          </ul>
          <p className="mt-3">We never sell, rent, or share your data with third parties for commercial purposes.</p>
        </section>

        <section>
          <h2>3. Third-Party Services</h2>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <strong className="text-white">Stripe</strong> — payment processing.{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                Stripe Privacy Policy ↗
              </a>
            </li>
            <li>
              <strong className="text-white">Supabase</strong> — secure storage of license keys and emails.{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                Supabase Privacy Policy ↗
              </a>
            </li>
            <li>
              <strong className="text-white">Resend</strong> — license email delivery.{" "}
              <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer">
                Resend Privacy Policy ↗
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Data Retention</h2>
          <p>
            We retain your email address and license key for as long as your subscription is active,
            then for 12 months after cancellation for support purposes.
            You may request deletion at any time.
          </p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>
            You have the right to access, correct, delete, and export your personal data.
            To exercise these rights, contact us at{" "}
            <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>.
          </p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            This site does not use tracking or advertising cookies.
            Strictly necessary technical cookies may be present
            (e.g., Stripe session cookies during checkout).
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For any questions about this policy:{" "}
            <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
