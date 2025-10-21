import { data } from "react-router";
import type { Route } from "./+types/provider";
import { getSeoMetas } from "~/lib/seo";
import { getProviderImageUrl } from "~/components/provider-image";
import { ErrorComponent } from "~/components/error-component";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db } = context;

  const provider = await db.query.newsProvider.findFirst({
    where: (provider, { eq }) => eq(provider.key, params.providerKey),
  });

  if (!provider) {
    throw new Response("Provider not found", { status: 404 });
  }

  return data({ provider }, {});
}

export default function ProviderPage({ loaderData }: Route.ComponentProps) {
  const { provider } = loaderData;

  return (
    <div>
      <h1>{provider.name}</h1>
      <p>{provider.biasRating}</p>
      <p>{provider.url}</p>
    </div>
  );
}

export function meta({ data, location }: Route.MetaArgs) {
  const { provider } = data;

  return getSeoMetas({
    title: provider.name,
    description:
      "Več informacij o " +
      provider.name +
      " in njegovi oceni medijske pristranskosti.",
    image: getProviderImageUrl(provider.key),
    pathname: location.pathname,
    keywords: `${provider.name}, medijska pristranskost, mediji`,
    ogType: "article",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
