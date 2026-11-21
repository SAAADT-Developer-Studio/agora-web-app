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
    <footer className="bg-surface text-surface-text border-primary/10 mt-20 border-t">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
            <Wordmark />
            <span className="bg-primary/15 hidden h-5 w-px md:block" />
            <p className="text-surface-text/55 text-[14px]">
              Ista novica. Vsi vidiki.
            </p>
          </div>
          <nav aria-label="Noga">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px] md:flex md:gap-x-5">
              {LINKS.map(({ name, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    prefetch="intent"
                    className="text-surface-text/70 hover:text-surface-text transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-primary/10 text-surface-text/45 mt-6 grid grid-cols-2 items-center gap-y-3 border-t pt-4 text-[13px] md:grid-cols-3">
          <p className="flex items-center gap-2" suppressHydrationWarning>
            <BiasSpectrum className="w-10" />© {year} vidik.si
          </p>
          <p className="text-right md:text-center">
            <b>M</b>&amp;<b>B</b> Production
          </p>
          {/* First on phones, so the icons don't dangle under the small print. */}
          <SocialLinks className="order-first col-span-2 -ml-2 md:order-none md:col-span-1 md:-mr-2 md:ml-0 md:justify-end" />
        </div>
      </div>
    </footer>
  );
}
