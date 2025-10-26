import { getSeoMetas } from "~/lib/seo";
import type { Route } from "./+types/privacy-policy";
import { LastUpdatedBadge } from "~/components/last-updated-badge";
import { ErrorComponent } from "~/components/error-component";

export const LAST_UPDATED = new Date("2025-10-20");

export function headers() {
  // Prevent caching, for now, since we have some sort of caching issue
  return {
    "Cache-Control": "max-age=0, must-revalidate",
  };
}

export default function PrivacyPolicyPage({}: Route.ComponentProps) {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-1 py-6 sm:px-4 md:px-6 md:py-8">
        <div className="mb-10">
          <LastUpdatedBadge date={LAST_UPDATED} className="mb-3" />
          <h1 className="text-primary mb-4 text-4xl font-bold tracking-tight">
            Politika zasebnosti
          </h1>
          <p className="text-primary/70 max-w-2xl leading-relaxed">
            Vaša zasebnost je za nas pomembna. Spodaj je razloženo, kako
            zbiramo, uporabljamo in varujemo vaše podatke.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-primary/10 bg-primary/5 rounded-xl border p-4">
            <h2 className="text-primary mb-3 text-2xl font-bold">
              Katere podatke obdelujemo
            </h2>
            <p className="text-primary/70 leading-relaxed">
              Za delovanje naše spletne strani in izboljšanje vaše izkušnje
              obdelujemo naslednje kategorije podatkov:
            </p>
          </div>

          <section className="border-primary/10 bg-card rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <svg
                  className="text-primary h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h2 className="text-primary text-xl font-bold">
                Tehnični podatki
              </h2>
            </div>
            <ul className="space-y-3">
              {[
                "IP naslov (anonimiziran)",
                "Tip naprave in brskalnika",
                "Čas dostopa",
                "URL-ji",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-primary/20 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                    <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                  </div>
                  <span className="text-primary/80 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-primary/10 bg-card rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <svg
                  className="text-primary h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-primary text-xl font-bold">Nastavitve</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-primary/20 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                </div>
                <span className="text-primary/80 leading-relaxed">
                  Izbira barvne teme (piškotek "theme" ali podobno)
                </span>
              </li>
            </ul>
          </section>

          <section className="border-primary/10 bg-card rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <svg
                  className="text-primary h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-primary text-xl font-bold">
                  Analitika uporabe
                </h2>
                <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Nujno
                </span>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-primary/20 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                </div>
                <span className="text-primary/80 leading-relaxed">
                  Merjenje obiskov preko storitve PostHog
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Politika zasebnosti | Vidik",
    description: "Politika zasebnosti za uporabnike platforme Vidik.",
    pathname: location.pathname,
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
