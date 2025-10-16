import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/category";
import { config } from "~/config";
import { data, Link } from "react-router";
import { useMediaQuery } from "~/hooks/use-media-query";
import HeroArticles from "~/components/hero-articles";
import type { ArticleType } from "~/lib/services/ranking";
import { Article } from "~/components/article";
import { getCategoryArticlesWithOffset } from "~/lib/services/ranking";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Database } from "~/lib/db";
import { getMaxAge } from "~/utils/getMaxage";

const categorySet = new Set<string>(config.categories.map((c) => c.key));

async function fetchCategoryData(
  category: string,
  offset: number,
  count: number,
): Promise<{ articles: ArticleType[] }> {
  return await fetch(
    `/api/category/${category}?count=${count}&offset=${offset}`,
  ).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to fetch category data: ${res.statusText}`);
    }
    return res.json();
  });
}

export async function fetchCategoryArticlesData({
  db,
  category,
}: {
  db: Database;
  category: string;
}) {
  const articles = await getCategoryArticlesWithOffset({
    db,
    category,
    count: 21,
    offset: 0,
  });
  return articles;
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const category = params.category;
  const { db, kvCache } = context;
  if (!categorySet.has(category)) {
    throw new Response("Category Not Found", { status: 404 });
  }

  const articles = await kvCache.cached(
    async () => await fetchCategoryArticlesData({ db, category }),
    {
      key: `data:category:${category}`,
      expirationTtl: 10 * 60,
    },
  );

  const maxAge = await getMaxAge(kvCache);

  return data(
    { articles },
    {
      headers: {
        "Cache-Control": `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${5 * 60}, stale-if-error=${3 * 60 * 60}`,
      },
    },
  );
}

export default function CategoryPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { articles } = loaderData;

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["category", params.category],
      queryFn: ({ pageParam = 0 }) =>
        fetchCategoryData(params.category, pageParam, 21),
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.articles.length === 21) {
          return allPages.length * 21;
        } else {
          return undefined;
        }
      },
      initialPageParam: 0,
      initialData: { pages: [{ articles }], pageParams: [0] },
    });

  const isLarge = useMediaQuery("(min-width: 64rem)");
  const sliceEnd = isLarge ? 6 : 5;

  return (
    <div className="px-3 md:px-6">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="uppercase hover:text-white">
          Domov
        </Link>
        <span className="text-white">·</span>
        <span className="text-white uppercase">{params.category}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <HeroArticles articles={data.pages[0].articles.slice(0, sliceEnd)} />
        {data.pages[0].articles.slice(sliceEnd).map((article) => (
          <Article key={article.id} {...article} />
        ))}
        {data.pages
          .slice(1)
          .map((page, pageIndex) =>
            page.articles.map((article) => (
              <Article key={article.id} {...article} />
            )),
          )}
      </div>
      {isFetchingNextPage && <p>Nalagam več člankov...</p>}
      {hasNextPage && (
        <button
          className="bg-primary hover:bg-primary/80 text-background mt-4 flex w-full cursor-pointer items-center justify-center rounded-md py-2"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          Naloži več člankov
        </button>
      )}
    </div>
  );
}

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: `${params.category.toUpperCase()} | Vidik`,
      name: "description",
      content: "Explore various categories of articles.",
    },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
