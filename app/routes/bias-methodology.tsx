import { getSeoMetas } from "~/lib/seo";
import type { Route } from "./+types/bias-methodology";
import {
  ExternalLink,
  BookOpen,
  Users,
  FileSearch,
  BarChart,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { LastUpdatedBadge } from "~/components/last-updated-badge";
import { ErrorComponent } from "~/components/error-component";

export const LAST_UPDATED = new Date("2025-10-21");

const BIAS_RATINGS = [
  {
    label: "Leva",
    color: "bg-red-500",
    description:
      "Mediji z izrazito levo politično usmeritvijo, ki pogosto podpirajo progresivne ali liberalne ideje, oz. stranke",
  },
  {
    label: "Center Leva",
    color: "bg-red-300",
    description:
      "Mediji z blago levo naklonjenostjo, ki se osredotočajo na uravnoteženo poročanje z rahlo liberalno perspektivo",
  },
  {
    label: "Center",
    color: "bg-gray-400",
    description:
      "Mediji z nevtralnim ali uravnoteženim pristopom, ki se trudijo za objektivnost in izogibanje političnim pristranskostim",
  },
  {
    label: "Center Desna",
    color: "bg-blue-400",
    description:
      "Mediji z blago desno naklonjenostjo, ki se osredotočajo na uravnoteženo poročanje z rahlo konservativno perspektivo",
  },
  {
    label: "Desna",
    color: "bg-blue-500",
    description:
      "Mediji z izrazito desno politično usmeritvijo, ki pogosto podpirajo konservativne ali tradicionalne ideje oz. stranke",
  },
];

export function headers() {
  // Prevent caching, for now, since we have some sort of caching issue
  return {
    "Cache-Control": "max-age=0, must-revalidate",
  };
}

export default function BiasMethodologyPage({}: Route.ComponentProps) {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-1 py-6 sm:px-4 md:px-6 md:py-8">
        <div className="text mb-10">
          <LastUpdatedBadge date={LAST_UPDATED} className="mb-3" />
          <h1 className="text-primary mb-4 text-4xl font-bold tracking-tight md:text-4xl">
            Metodologija
          </h1>
          <p className="text-primary/70 max-w-3xl leading-normal">
            Ocenjujemo politično pristranskost slovenskih medijskih hiš na
            podlagi znanstvenih raziskav in analize lastništva.
          </p>
        </div>

        <BiasRatingsLegend />

        <section className="mb-10">
          <h2 className="text-primary mb-4 text-2xl font-bold">
            Kako Določamo Ocene
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="text-primary h-5 w-5" />
                <h3 className="text-primary text-lg font-bold">
                  Znanstvene raziskave
                </h3>
              </div>
              <p className="text-primary/70 mb-3 text-sm leading-normal">
                Večina ocen temelji na dveh znanstvenih raziskavah slovenskega
                medijskega prostora, ostale pa na analizi vzorca člankov ali
                politični nagnjenosti lastniške organizacije.
              </p>

              <div className="space-y-3">
                <a
                  href="https://www.eecs.qmul.ac.uk/~mpurver/papers/caporusso-et-al24jadt-politics.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-background group block rounded border p-3 transition-all duration-200 hover:shadow-md"
                  aria-label="Odpri raziskavo: Analiza pristranskosti v slovenskih medijih"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="text-primary group-hover:text-primary/90 text-sm font-semibold transition-colors">
                      Analiza pristranskosti v slovenskih medijih
                    </h4>
                    <ExternalLink className="text-primary h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-primary/60 mb-1 text-xs">
                    Caporusso et al. (2024)
                  </p>
                  <p className="text-primary/70 text-xs leading-normal">
                    Computational raziskava kombinira korpus novic z anketami o
                    medijski potrošnji in politični usmeritvi bralcev. Gradnja
                    klasifikatorja politične orientacije na podlagi medijskih
                    hiš.
                  </p>
                </a>

                <a
                  href="https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2023.1143786/full"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-background group block rounded border p-3 transition-all duration-200 hover:shadow-md"
                  aria-label="Odpri raziskavo: Medijski pluralizem in ideološka usmeritev"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="text-primary group-hover:text-primary/90 text-sm font-semibold transition-colors">
                      Medijski pluralizem in ideološka usmeritev
                    </h4>
                    <ExternalLink className="text-primary h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-primary/60 mb-1 text-xs">
                    Besednjak Valič et al. (2023)
                  </p>
                  <p className="text-primary/70 text-xs leading-normal">
                    Analiza 1.434 tekstov iz 10 različnih slovenskih medijev z
                    uporabo Janis-Fadner koeficienta. Odkriva šibko medijsko
                    pluralnost kot glavno značilnost slovenskega medijskega
                    prostora.
                  </p>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BiasRatingsLegend() {
  return (
    <section className="mb-8">
      <h2 className="text-primary mb-4 text-2xl font-bold">
        Lestvica Pristranskosti
      </h2>
      <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-5">
        {BIAS_RATINGS.map((rating) => (
          <div key={rating.label} className="">
            <div className="flex items-end gap-3">
              <div className={cn("mb-2 size-8 rounded-sm", rating.color)} />
              <h3 className={cn("mb-1 pb-[3px] text-xl font-semibold")}>
                {rating.label}
              </h3>
            </div>
            <p className="text-primary/60 text-xs">{rating.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Metodologija Ocenjevanja Pristranskosti | Vidik",
    description:
      "Naša metodologija ocenjevanja pristranskosti virov novic na podlagi analize vsebine, lastništva, zgodovine poročanja in neodvisnih ocen.",
    pathname: location.pathname,
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
