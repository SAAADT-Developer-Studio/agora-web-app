import { ArrowRight } from "lucide-react";
import { Await, Link, href } from "react-router";
import { Suspense } from "react";
import { BiasRatingKey } from "~/enums/biasRatingKey";
import { cn } from "~/lib/utils";
import type { RandomProvider } from "~/lib/services/randomProviders";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { ProviderImage } from "./provider-image";
import { ErrorUI } from "./ui/error-ui";
import { Skeleton } from "./ui/skeleton";

const SCALE = [
  BiasRatingKey.Left,
  BiasRatingKey.CenterLeft,
  BiasRatingKey.Center,
  BiasRatingKey.CenterRight,
  BiasRatingKey.Right,
];

function ratingLabel(rating: string | null) {
  const label = biasKeyToLabel(rating ?? "");
  return label.charAt(0).toLocaleUpperCase("sl-SI") + label.slice(1);
}

export function VotingCard({
  randomProviders,
}: {
  randomProviders: Promise<RandomProvider[]>;
}) {
  return (
    <aside
      aria-labelledby="voting-card"
      className="bg-surface-light border-primary/10 flex flex-col rounded-xl border p-4 shadow-xs sm:col-span-2 md:p-5 lg:col-span-1 lg:row-span-2"
    >
      <h3
        id="voting-card"
        className="text-primary text-lg leading-tight font-bold tracking-tight"
      >
        Se ne strinjaš z oceno?
      </h3>
      <p className="text-primary/60 mt-1 text-sm text-pretty">
        Tako smo ocenili te medije. Če misliš drugače, glasuj.
      </p>

      <ul className="divide-primary/10 mt-3 flex flex-1 flex-col divide-y sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 lg:flex lg:divide-y">
        <Suspense fallback={<VotingSkeleton />}>
          <Await
            resolve={randomProviders}
            errorElement={
              <li className="flex flex-1 items-center justify-center">
                <ErrorUI message="Napaka pri nalaganju medijev" size="small" />
              </li>
            }
          >
            {(providers) =>
              providers.map((p) => <ProviderRow key={p.key} provider={p} />)
            }
          </Await>
        </Suspense>
      </ul>

      <Link
        to={href("/mediji")}
        className="text-primary/60 hover:text-electricblue group border-primary/10 flex items-center gap-1 self-stretch border-t pt-3 text-sm font-semibold transition-colors"
      >
        Vsi mediji in ocene
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </aside>
  );
}

function ProviderRow({ provider: p }: { provider: RandomProvider }) {
  const name =
    p.name.toLocaleLowerCase() === "slovenska tiskovna agencija"
      ? "STA"
      : p.name;

  return (
    <li className="flex flex-1">
      <Link
        to={href("/medij/:providerKey", { providerKey: p.key })}
        aria-label={`${name}: ${ratingLabel(p.biasRating)}. Glasuj za oceno.`}
        className="group focus-visible:ring-electricblue flex flex-1 items-center gap-3 rounded-lg py-3 focus-visible:ring-2 focus-visible:outline-none"
      >
        <ProviderImage
          provider={p}
          loading="lazy"
          className="border-primary/10 size-10 shrink-0 rounded-lg border bg-white object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="text-primary group-hover:text-electricblue truncate font-semibold transition-colors">
            {name}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span aria-hidden className="flex w-20 shrink-0 gap-0.5">
              {SCALE.map((key) => (
                <span
                  key={key}
                  className={cn(
                    "h-1.5 flex-1 rounded-full border-0",
                    key === p.biasRating
                      ? biasKeyToColor(key)
                      : "bg-primary/10",
                  )}
                />
              ))}
            </span>
            <span className="text-primary/70 truncate text-xs font-semibold">
              {ratingLabel(p.biasRating)}
            </span>
          </div>
        </div>

        <span className="border-primary/15 text-primary/70 group-hover:border-electricblue group-hover:bg-electricblue shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors group-hover:text-white">
          Glasuj
        </span>
      </Link>
    </li>
  );
}

function VotingSkeleton() {
  return Array.from({ length: 4 }, (_, idx) => (
    <li key={idx} className="flex flex-1 items-center gap-3 py-3">
      <Skeleton className="bg-primary/10 size-10 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="bg-primary/10 h-4 w-28" />
        <Skeleton className="bg-primary/10 h-1.5 w-20" />
      </div>
    </li>
  ));
}
