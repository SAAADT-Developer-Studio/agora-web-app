import { data } from "react-router";
import type { Route } from "./+types/provider";
import { getSeoMetas } from "~/lib/seo";

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
  const url = new URL(location.pathname, "https://vidik.si").href;
  return getSeoMetas({
    title: provider.name,
    description:
      "Learn more about " + provider.name + " and its media bias rating.",
    image: "todo",
    url,
    keywords: `${provider.name}, media bias, news provider`,
    ogType: "article",
  });
}
