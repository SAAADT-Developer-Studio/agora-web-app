import { Link, data, href } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/providers";
import { getSeoMetas } from "~/lib/seo";
import { getAppContext } from "~/lib/appContext";
import { MEDIA_LANDSCAPE_CACHE_KEY } from "~/lib/kvCache/keys";
import { fetchMediaLandscape } from "~/lib/services/mediaLandscape";
import { VariantSwitcher, useVariant } from "~/components/mediji/shared";
import { MojeBranjeVariant } from "~/components/mediji/variant-moje-branje";
import { SpekterVariant } from "~/components/mediji/variant-spekter";
import { PrimerjavaVariant } from "~/components/mediji/variant-primerjava";

/** Coverage metrics move slowly; an hour keeps the heavy queries rare. */
const LANDSCAPE_TTL_SECONDS = 60 * 60;

export async function loader({ context }: Route.LoaderArgs) {
  const { db, kvCache, measurer } = getAppContext(context);

  const landscape = await measurer.time("fetchMediaLandscape", () =>
    kvCache.cached(() => fetchMediaLandscape(db), {
      key: MEDIA_LANDSCAPE_CACHE_KEY,
      expirationTtl: LANDSCAPE_TTL_SECONDS,
    }),
  );

  return data(landscape, {
    headers: { "Cache-Control": "max-age=60, s-maxage=60" },
  });
}

export function headers() {
  // Prevent caching, for now, since we have some sort of caching issue
  return {
    "Cache-Control": "max-age=0, must-revalidate",
  };
}

const LEDES = {
  a: "Označi medije, ki jih bereš, in poglej, s katere strani dobivaš novice ter katere glavne zgodbe ti uidejo.",
  b: "Vsi mediji na enem spektru. Večji logotip pomeni več bralcev. Izberi medij za podroben profil.",
  c: "Primerjaj medije po dosegu, pokritosti glavnih zgodb, hitrosti in tem, ali se bralci strinjajo z oceno.",
} as const;

export default function ProvidersPage({ loaderData }: Route.ComponentProps) {
  const [variant, setVariant] = useVariant();

  return (
    <section className="mx-auto max-w-6xl px-1 pt-1 pb-24 md:pt-6">
      <header className="mb-6 md:mb-8">
        <h1 className="text-primary text-[1.9rem] leading-none font-bold tracking-tight md:text-5xl">
          Mediji
        </h1>
        <p className="text-primary/70 mt-3 max-w-2xl text-[15px] leading-snug md:text-lg">
          {LEDES[variant]}{" "}
          <Link
            to={href("/metodologija")}
            className="text-link font-semibold whitespace-nowrap hover:underline"
          >
            Kako ocenjujemo
          </Link>
        </p>
      </header>

      {variant === "a" && <MojeBranjeVariant data={loaderData} />}
      {variant === "b" && <SpekterVariant data={loaderData} />}
      {variant === "c" && <PrimerjavaVariant data={loaderData} />}

      <VariantSwitcher current={variant} onChange={setVariant} />
    </section>
  );
}

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return getSeoMetas({
    title: "Mediji | Vidik",
    description:
      "Pregled slovenskih novičarskih organizacij na Vidiku z ocenami medijske pristranskosti in statistiko poročanja.",
    pathname: location.pathname,
    keywords:
      "vidik, mediji, slovenski mediji, medijska pristranskost, novičarske organizacije",
    ogType: "website",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
