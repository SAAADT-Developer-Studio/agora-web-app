import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/providers";
import { getSeoMetas } from "~/lib/seo";
import { fetchProviders } from "~/lib/services";

export async function loader({ params, context }: Route.LoaderArgs) {
  const providers = await fetchProviders();
  return { providers };
}

export default function ProvidersPage({ loaderData }: Route.ComponentProps) {
  const { providers } = loaderData;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Providers </h1>
      {providers.map((provider) => (
        <div key={provider.key} className="my-2 rounded border p-2">
          <h2 className="text-xl">{provider.name}</h2>
          <p>Rank: {provider.rank}</p>
          <a href={provider.url} className="text-blue-500 hover:underline">
            {provider.url}
          </a>
        </div>
      ))}
    </div>
  );
}

export function meta({
  params,
  location,
}: Route.MetaArgs): Route.MetaDescriptors {
  return getSeoMetas({
    title: "Mediji | Vidik",
    description: "Novičarske organizacije, ki jih podpira Vidik",
    pathname: location.pathname,
    keywords: "vidik, mediji, novičarske organizacije",
    ogType: "website",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
