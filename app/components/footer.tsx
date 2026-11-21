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
          <div className="flex items-center gap-4">
            <Wordmark />
            <span className="bg-primary/15 hidden h-5 w-px md:block" />
            <p className="text-surface-text/55 hidden text-[14px] md:block">
              Ista novica. Vsi vidiki.
            </p>
          </div>
          <nav aria-label="Noga">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
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

        <div className="border-primary/10 mt-6 flex flex-col-reverse gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <p
            className="text-surface-text/45 flex items-center gap-2 text-[13px]"
            suppressHydrationWarning
          >
            <BiasSpectrum className="w-10" />© {year} vidik.si · <b>M</b>&amp;
            <b>B</b> Production
          </p>
          <SocialLinks className="-ml-2 md:-mr-2 md:ml-0" />
        </div>
      </div>
    </footer>
  );
}
