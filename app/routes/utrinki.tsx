import type { Route } from "./+types/utrinki";
import { data } from "react-router";
import type { ReactNode } from "react";
import { ErrorComponent } from "~/components/error-component";
import { Header } from "~/components/header";
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

/** The site header on top, the reel filling the rest of the screen. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header categories={false} />
      {children}
    </div>
  );
}

export function HydrateFallback() {
  return (
    <Frame>
      <UtrinkiSkeleton />
    </Frame>
  );
}

export default function UtrinkiRoute({ loaderData }: Route.ComponentProps) {
  return (
    <Frame>
      <UtrinkiFeed page={loaderData} />
    </Frame>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-4 md:px-6">
        <ErrorComponent error={error} />
      </main>
    </>
  );
}
