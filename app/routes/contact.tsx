import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/contact";
import { getSeoMetas } from "~/lib/seo";
import { Mail, MessageSquare } from "lucide-react";

export function loader({ params }: Route.LoaderArgs) {
  return null;
}

export default function ContactPage({}: Route.ComponentProps) {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="text-start">
          <h1 className="text-primary mb-6 text-4xl font-bold tracking-tight">
            Kontakt
          </h1>
          <p className="text-primary/70 w-full text-lg leading-relaxed md:w-1/2">
            Imate vprašanje, predlog ali želite povezavo z nami? Spodaj sta dva
            najhitrejša načina.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-5xl px-6 pb-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="group bg-primary/5 border-primary/10 relative flex flex-col items-start justify-between overflow-hidden rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="mb-2 flex w-full items-center justify-between rounded-full">
              {" "}
              <h2 className="text-primary mb-2 text-2xl font-medium tracking-tight">
                E-pošta
              </h2>
              <Mail className="text-primary h-6 w-6" />
            </div>

            <p className="text-primary/70 mb-2 leading-relaxed">
              Pišite nam in odgovorili bomo v najkrajšem možnem času.
            </p>
            <a
              href="mailto:info@vidk.si"
              className="bg-primary text-background hover:bg-primary/90 mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
              aria-label="Pošlji e-pošto na info@vidk.si"
            >
              info@vidk.si
            </a>
          </div>
          <div className="group bg-primary/5 border-primary/10 relative flex flex-col items-start justify-between overflow-hidden rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="bg-muted mb-2 flex w-full items-center justify-between rounded-full">
              {" "}
              <h2 className="text-primary mb-2 text-2xl font-medium tracking-tight">
                Povratne informacije
              </h2>
              <MessageSquare className="text-primary h-6 w-6" />
            </div>

            <p className="text-primary/70 mb-2 w-[90%] leading-relaxed">
              Sporočite nam vaše ideje, misli ali predlagajte popravke.
            </p>
            <button
              type="button"
              data-feedback-fish
              className="bg-primary text-background hover:bg-primary/90 mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
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

export function meta({
  params,
  location,
}: Route.MetaArgs): Route.MetaDescriptors {
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
