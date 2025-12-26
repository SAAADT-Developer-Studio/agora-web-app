import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/contact";
import { getSeoMetas } from "~/lib/seo";
import { Mail, MessageSquare } from "lucide-react";

export function loader({}: Route.LoaderArgs) {
  return null;
}

export function headers() {
  // Prevent caching, for now, since we have some sort of caching issue
  return {
    "Cache-Control": "max-age=0, must-revalidate",
  };
}

export default function ContactPage({}: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-5xl px-1 py-6 sm:px-4 md:px-6 md:py-8">
      <div className="">
        <div className="text-start">
          <h1 className="text-surface-text mb-6 text-4xl font-bold tracking-tight">
            Kontakt
          </h1>
          <p className="text-surface-text/70 w-full text-lg leading-relaxed md:w-1/2">
            Imate vprašanje, predlog ali želite povezavo z nami? Spodaj sta dva
            najhitrejša načina.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-5xl pb-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="group bg-primary/5 border-primary/10 relative flex flex-col items-start justify-between overflow-hidden rounded-lg border p-4 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-5">
            <div className="mb-2 flex w-full items-center justify-between rounded-full">
              {" "}
              <h2 className="text-surface-text mb-2 text-2xl font-medium tracking-tight">
                E-pošta
              </h2>
              <Mail className="text-surface-text h-6 w-6" />
            </div>

            <p className="text-surface-text/70 mb-2 leading-relaxed">
              Pišite nam in odgovorili bomo v najkrajšem možnem času.
            </p>
            <a
              href="mailto:info@vidik.si"
              className="bg-primary text-surface-text-text hover:bg-primary/90 mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
              aria-label="Pošlji e-pošto na info@vidik.si"
            >
              info@vidik.si
            </a>
          </div>
          <div className="group bg-primary/5 border-primary/10 relative flex flex-col items-start justify-between overflow-hidden rounded-lg border p-4 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-5">
            <div className="bg-muted mb-2 flex w-full items-center justify-between rounded-full">
              {" "}
              <h2 className="text-surface-text mb-2 text-2xl font-medium tracking-tight">
                Povratne informacije
              </h2>
              <MessageSquare className="text-surface-text h-6 w-6" />
            </div>

            <p className="text-surface-text/70 mb-2 w-[90%] leading-relaxed">
              Sporočite nam vaše ideje, misli ali predlagajte popravke.
            </p>
            <button
              type="button"
              data-feedback-fish
              className="bg-primary text-surface-text-text hover:bg-primary/90 mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
              aria-label="Odpri obrazec za povratne informacije"
            >
              Pošlji povratne informacije
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return getSeoMetas({
    title: "Kontakt | Vidik",
    description:
      "Kontaktirajte nas za vprašanja, predloge, podporo ali dodatne informacije.",
    pathname: location.pathname,
    ogType: "website",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
