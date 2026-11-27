import { href, Link } from "react-router";
import { useClientNow } from "~/components/render-clock";
import { BiasSpectrum, Wordmark } from "~/components/side-menu";
import { SocialLinks } from "~/components/social-links";
import { formatSlovenianYear } from "~/lib/date";

const LINKS = [
  { name: "Mediji", to: href("/mediji") },
  { name: "Kako ocenjujemo medije", to: href("/metodologija") },
  { name: "Kontakt in podpora", to: href("/kontakt") },
  { name: "Politika zasebnosti", to: href("/politika-zasebnosti") },
];

/** Quiet, compact footer: one row of links, one line of small print. */
export default function Footer() {
  const year = formatSlovenianYear(new Date(useClientNow()));
  return (
    <footer className="bg-surface text-surface-text border-primary/10 mt-12 border-t md:mt-20">
      <div className="mx-auto max-w-[1200px] px-4 pt-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-4">
              <Wordmark />
              <span className="bg-primary/15 hidden h-5 w-px md:block" />
              <p className="text-surface-text/55 text-[14px]">
                Ista novica. Vsi vidiki.
              </p>
            </div>
            {/* On phones the icons share the brand row instead of floating alone. */}
            <SocialLinks className="-mt-1.5 -mr-2 md:hidden" />
          </div>
          <nav aria-label="Noga">
            <ul className="flex flex-col text-[15px] md:flex-row md:gap-x-5 md:text-[14px]">
              {LINKS.map(({ name, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    prefetch="intent"
                    className="text-surface-text/70 hover:text-surface-text block py-2 transition-colors md:py-0"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-primary/10 text-surface-text/45 mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-4 text-[13px] md:mt-6 md:grid md:grid-cols-3">
          <div className="flex items-center gap-2" suppressHydrationWarning>
            <BiasSpectrum className="w-10" />© {year} vidik.si
          </div>
          <p className="before:mr-2 before:content-['·'] md:text-center md:before:content-none">
            <b>M</b>&amp;<b>B</b> Production
          </p>
          <SocialLinks className="hidden md:-mr-2 md:flex md:justify-end" />
        </div>
      </div>
    </footer>
  );
}
