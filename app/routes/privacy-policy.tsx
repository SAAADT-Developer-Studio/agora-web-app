import { getSeoMetas } from "~/lib/seo";
import type { Route } from "./+types/privacy-policy";

export const LAST_UPDATED = new Date("2025-10-20");

export default function PrivacyPolicyPage({}: Route.ComponentProps) {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-primary mb-2 pb-8">
          <h1 className="text-primary mb-4 text-4xl font-bold tracking-tight text-balance">
            Politika zasebnosti
          </h1>
          <p className="text-primary">
            Nazadnje posodobljeno:{" "}
            <span className="text-primary font-semibold">
              {LAST_UPDATED.toLocaleDateString("sl-SI", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="mb-6">
          <p className="text-primary mb-4 text-2xl font-semibold">
            Katere podatke obdelujemo
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-primary mb-4 text-2xl font-semibold">
            Tehnični podatki:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-primary leading-relaxed">
                IP naslov (anonimiziran)
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-primary leading-relaxed">
                tip naprave in brskalnika
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-primary leading-relaxed">čas dostopa</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-primary leading-relaxed">URL-ji</span>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-primary mb-4 text-2xl font-semibold">
            Nastavitve:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-primary leading-relaxed">
                izbira barvne teme (piškotek "theme" ali podobno)
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-2">
          <h2 className="text-primary mb-4 text-2xl font-semibold">
            Analitika uporabe (nujno):
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-primary leading-relaxed">
                merjenje obiskov prek PostHog
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export function meta({}: Route.MetaArgs) {
  return getSeoMetas({
    title: "Politika zasebnosti | Vidik",
    description: "Politika zasebnosti za uporabnike platforme Vidik.",
  });
}
