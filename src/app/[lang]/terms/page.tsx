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
    title: isEN ? "Terms of Service — MotherFlame" : "Conditions d'utilisation — MotherFlame",
    description: isEN
      ? "Terms governing your use of MotherFlame and the Meta subscription."
      : "Conditions régissant l'utilisation de MotherFlame et de l'abonnement Meta.",
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  await getDictionary(lang);
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
          Conditions d&apos;utilisation
        </h1>
        <p className="mb-12 text-sm text-zinc-500">Dernière mise à jour : {lastUpdated}</p>

        <div className="space-y-10 text-zinc-300 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-pink-400 [&_a]:underline-offset-2 [&_a:hover]:text-pink-300">

          <p>
            En utilisant MotherFlame ou en souscrivant à l&apos;abonnement Meta Access,
            vous acceptez les présentes conditions. Si vous n&apos;acceptez pas ces conditions,
            veuillez ne pas utiliser le service.
          </p>

          <section>
            <h2>1. Description du service</h2>
            <p>
              MotherFlame est une application de bureau gratuite pour suivre vos parties de One Piece TCG.
              L&apos;abonnement <strong className="text-white">Meta Access</strong> (3,99 €/mois) débloque
              l&apos;onglet Meta, qui affiche des statistiques agrégées et des decklists issues de la communauté.
            </p>
          </section>

          <section>
            <h2>2. Abonnement et facturation</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>L&apos;abonnement est mensuel et se renouvelle automatiquement.</li>
              <li>Le paiement est traité par <strong className="text-white">Stripe</strong>. Vous recevez une clé de licence par e-mail après chaque paiement réussi.</li>
              <li>Vous pouvez annuler à tout moment via le portail Stripe. L&apos;accès reste actif jusqu&apos;à la fin de la période payée.</li>
              <li>Les prix sont susceptibles d&apos;être modifiés avec un préavis de 30 jours.</li>
            </ul>
          </section>

          <section>
            <h2>3. Politique de remboursement</h2>
            <p>
              Les paiements ne sont pas remboursables, sauf obligation légale.
              Si vous rencontrez un problème technique empêchant l&apos;utilisation du service,
              contactez-nous à{" "}
              <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>{" "}
              dans les 7 jours suivant le paiement et nous étudierons votre demande au cas par cas.
            </p>
          </section>

          <section>
            <h2>4. Clé de licence</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>La clé de licence est personnelle et non transférable.</li>
              <li>Elle est liée à votre abonnement actif et cesse de fonctionner en cas d&apos;annulation ou de défaut de paiement.</li>
              <li>Le partage de clé est interdit et peut entraîner la résiliation du compte.</li>
            </ul>
          </section>

          <section>
            <h2>5. Utilisation acceptable</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Tenter de contourner le système de licences</li>
              <li>Revendre ou redistribuer le service</li>
              <li>Utiliser le service à des fins illégales</li>
            </ul>
          </section>

          <section>
            <h2>6. Disponibilité du service</h2>
            <p>
              Nous nous efforçons d&apos;assurer la disponibilité du service, mais nous ne garantissons pas
              un accès ininterrompu. Nous ne sommes pas responsables des interruptions dues à des tiers
              (Stripe, Supabase, etc.).
            </p>
          </section>

          <section>
            <h2>7. Propriété intellectuelle</h2>
            <p>
              MotherFlame et son contenu sont protégés par les droits d&apos;auteur.
              One Piece Card Game est une marque de Bandai Co., Ltd.
              MotherFlame n&apos;est pas affilié à Bandai.
            </p>
          </section>

          <section>
            <h2>8. Limitation de responsabilité</h2>
            <p>
              Dans les limites permises par la loi, MotherFlame ne peut être tenu responsable
              des dommages indirects, accessoires ou consécutifs liés à l&apos;utilisation du service.
            </p>
          </section>

          <section>
            <h2>9. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions à tout moment. En cas de changement important,
              nous vous en informerons par e-mail ou via le site. L&apos;utilisation continue du service
              après modification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>
              Pour toute question :{" "}
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

      <h1 className="mb-2 text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mb-12 text-sm text-zinc-500">Last updated: {lastUpdated}</p>

      <div className="space-y-10 text-zinc-300 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-pink-400 [&_a]:underline-offset-2 [&_a:hover]:text-pink-300">

        <p>
          By using MotherFlame or subscribing to Meta Access,
          you agree to these terms. If you do not agree, please do not use the service.
        </p>

        <section>
          <h2>1. Service Description</h2>
          <p>
            MotherFlame is a free desktop application for tracking One Piece TCG matches.
            The <strong className="text-white">Meta Access</strong> subscription (€3.99/month) unlocks
            the Meta tab, which displays aggregated community statistics and decklists.
          </p>
        </section>

        <section>
          <h2>2. Subscription &amp; Billing</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>The subscription is monthly and renews automatically.</li>
            <li>Payments are processed by <strong className="text-white">Stripe</strong>. You receive a license key by email after each successful payment.</li>
            <li>You may cancel at any time via the Stripe portal. Access remains active until the end of the paid period.</li>
            <li>Prices may change with 30 days&apos; notice.</li>
          </ul>
        </section>

        <section>
          <h2>3. Refund Policy</h2>
          <p>
            Payments are non-refundable except where required by law.
            If a technical issue prevents you from using the service,
            contact us at{" "}
            <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>{" "}
            within 7 days of payment and we will review your case individually.
          </p>
        </section>

        <section>
          <h2>4. License Key</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Your license key is personal and non-transferable.</li>
            <li>It is tied to your active subscription and stops working if you cancel or fail to pay.</li>
            <li>Sharing your key is prohibited and may result in account termination.</li>
          </ul>
        </section>

        <section>
          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Attempt to circumvent the license system</li>
            <li>Resell or redistribute the service</li>
            <li>Use the service for illegal purposes</li>
          </ul>
        </section>

        <section>
          <h2>6. Service Availability</h2>
          <p>
            We strive to keep the service available, but we do not guarantee uninterrupted access.
            We are not liable for interruptions caused by third parties (Stripe, Supabase, etc.).
          </p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            MotherFlame and its content are protected by copyright.
            One Piece Card Game is a trademark of Bandai Co., Ltd.
            MotherFlame is not affiliated with Bandai.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            To the extent permitted by law, MotherFlame is not liable for indirect,
            incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2>9. Changes to These Terms</h2>
          <p>
            We may update these terms at any time. For material changes, we will notify you
            by email or on the site. Continued use of the service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            For any questions:{" "}
            <a href="mailto:support@optcg-motherflame.com">support@optcg-motherflame.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
