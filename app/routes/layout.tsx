import type { Route } from "./+types/layout";

import { Outlet } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import Footer from "~/components/footer";
import { Header } from "~/components/header";
import { type CacheMeta } from "~/routes/api/populate-cache";

export async function loader({ context }: Route.LoaderArgs) {
  const meta = await context.kvCache.get<CacheMeta>("meta");

  return { lastUpdated: meta?.lastUpdated ?? Date.now() };
}

export default function RootLayout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Header lastUpdated={loaderData.lastUpdated} />

      <main className="mx-auto h-full w-full max-w-[1200px] flex-1 px-3 py-4 md:mt-4 md:px-6">
        <Outlet />
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
