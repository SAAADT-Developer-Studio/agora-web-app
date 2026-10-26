import type { Route } from "./+types/utrinki";
import { data } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import { UtrinkiFeed } from "~/components/utrinki/feed";
import { UtrinkiSkeleton } from "~/components/utrinki/states";
import { getSeoMetas } from "~/lib/seo";
import { UNINDEXED_ROBOTS } from "~/lib/seo/unindexed";
import { readUtrinkiPage } from "~/lib/utrinki/readPage";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
    },
  ];
}

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Utrinki | Vidik",
    description:
      "Kratki sklopi slovenskih novic: kaj se je zgodilo in kako o tem poročajo mediji. Stran ni del javnega kazala.",
    pathname: location.pathname,
    robots: UNINDEXED_ROBOTS,
    ogType: "website",
  });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  const responseHeaders = new Headers(loaderHeaders);
  responseHeaders.set("X-Robots-Tag", UNINDEXED_ROBOTS);
  return responseHeaders;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { page, cacheControl } = await readUtrinkiPage(request, context);
  return data(page, {
    headers: { "Cache-Control": cacheControl },
  });
}

export function HydrateFallback() {
  return <UtrinkiSkeleton />;
}

export default function UtrinkiRoute({ loaderData }: Route.ComponentProps) {
  return <UtrinkiFeed page={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
