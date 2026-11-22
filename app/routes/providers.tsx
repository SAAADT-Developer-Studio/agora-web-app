import { Link, data, href } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/providers";
import { getSeoMetas } from "~/lib/seo";
import { getAppContext } from "~/lib/appContext";
import { MEDIA_LANDSCAPE_CACHE_KEY } from "~/lib/kvCache/keys";
import {
  LANDSCAPE_TTL_SECONDS,
  fetchMediaLandscape,
} from "~/lib/services/mediaLandscape";
import { Page, PageHeader } from "~/components/page";
import { MojeBranje } from "~/components/mediji/moje-branje";

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

export default function ProvidersPage({ loaderData }: Route.ComponentProps) {
  return (
    <Page>
      <PageHeader title="Mediji">
        Označi medije, ki jih bereš, in poglej, s katere strani dobivaš novice
        ter katere glavne zgodbe ti uidejo.{" "}
        <Link
          to={href("/metodologija")}
          className="text-link font-semibold whitespace-nowrap hover:underline"
        >
          Kako ocenjujemo
        </Link>
      </PageHeader>
      <MojeBranje data={loaderData} />
    </Page>
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
