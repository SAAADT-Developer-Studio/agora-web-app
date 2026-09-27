import { href, Link } from "react-router";
import { getSeoMetas } from "~/lib/seo";
import { getAppContext } from "~/lib/appContext";
import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/compare-clustering";
import {
  clanekPath,
  clusterForArticle,
  clusterMembers as fetchClusterMembers,
  embeddingDim,
  findArticle,
  findCluster,
  findStory,
  latestProductionRun,
  latestStoryFreshness,
  nearestStorySims,
  searchArticleTitles,
  splitClusters,
  splitStories,
  storyForArticle,
  storyMembers as fetchStoryMembers,
  unmatchedCounts,
  type ArticleRow,
  type ClusterRow,
  type MemberRow,
  type RunInfo,
  type SplitCluster,
  type SplitStory,
  type StoryRow,
} from "~/lib/services/clusteringExplore";

export function headers() {
  return { "Cache-Control": "private, no-store" };
}

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "compare-clustering · DEV | Vidik",
    description: "Compare story vs cluster_v2 clustering.",
    pathname: location.pathname,
    noindex: true,
    includeSiteSchema: false,
  });
}

function parseVidik(raw: string) {
  try {
    const url = new URL(raw, "https://vidik.si");
    const story = url.pathname.match(/^\/zgodba\/(\d+)\/?$/);
    if (story) return { kind: "story" as const, id: Number(story[1]) };
    const clanek = url.pathname.match(/^\/[^/]+\/clanek\/([^/]+)\/?$/);
    if (clanek)
      return {
        kind: "cluster" as const,
        idOrSlug: decodeURIComponent(clanek[1]),
      };
  } catch {
    return null;
  }
  return null;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { db } = getAppContext(context);
  const params = new URL(request.url).searchParams;
  const tab = params.get("tab") === "splits" ? "splits" : "lookup";
  const q = (params.get("q") ?? "").trim();
  const hasQuery = Boolean(q);

  const [run, dim, storyFreshness] = await Promise.all([
    latestProductionRun(db),
    embeddingDim(db),
    latestStoryFreshness(db),
  ]);

  if (!run) {
    return {
      tab,
      q,
      run: null,
      dim,
      storyFreshness,
      lookup: null,
      splits: null,
    };
  }

  if (tab === "splits") {
    const [stories, clusters, unmatched] = await Promise.all([
      splitStories(db, run.id),
      splitClusters(db, run.id),
      unmatchedCounts(db, run.id),
    ]);
    return {
      tab,
      q,
      run,
      dim,
      storyFreshness,
      lookup: null,
      splits: { stories, clusters, unmatched },
    };
  }

  if (!hasQuery) {
    return { tab, q, run, dim, storyFreshness, lookup: null, splits: null };
  }

  let article: ArticleRow | null = null;
  let story: StoryRow | null = null;
  let cluster: ClusterRow | null = null;
  let titleHits: ArticleRow[] = [];

  const vidik = q ? parseVidik(q) : null;
  if (vidik?.kind === "story") {
    story = await findStory(db, vidik.id);
  } else if (vidik?.kind === "cluster") {
    cluster = await findCluster(db, vidik.idOrSlug);
  } else if (q) {
    const looksLikeUrl = /^https?:\/\//i.test(q) || q.includes("/");
    if (looksLikeUrl || /^\d+$/.test(q)) {
      article = await findArticle(db, q);
      if (article) {
        const [s, c] = await Promise.all([
          storyForArticle(db, article.id),
          clusterForArticle(db, article.id, run.id),
        ]);
        story = s;
        cluster = c;
      } else if (/^\d+$/.test(q)) {
        const id = Number(q);
        const [s, c] = await Promise.all([
          findStory(db, id),
          findCluster(db, q),
        ]);
        story = s;
        cluster = c;
      }
    } else {
      cluster = await findCluster(db, q);
      if (!cluster) titleHits = await searchArticleTitles(db, q);
    }
  }

  let sMembers = story ? await fetchStoryMembers(db, story.id, run.id) : [];
  let cMembers = cluster
    ? await fetchClusterMembers(db, cluster.id, cluster.runId)
    : [];

  if (story && !cluster) {
    const top = majority(sMembers, (row) => row.clusterId);
    if (top?.clusterId) {
      cluster = {
        id: top.clusterId,
        title: top.clusterTitle ?? `#${top.clusterId}`,
        slug: top.clusterSlug,
        runId: run.id,
        createdAt: "",
      };
      cMembers = await fetchClusterMembers(db, cluster.id, run.id);
    }
  } else if (cluster && !story) {
    const top = majority(cMembers, (row) => row.storyId);
    if (top?.storyId) {
      story = {
        id: top.storyId,
        title: top.storyTitle ?? `#${top.storyId}`,
        lastArticlePublishedAt: "",
        createdAt: "",
        method: null,
        similarity: null,
        nearestArticleId: null,
      };
      sMembers = await fetchStoryMembers(db, story.id, run.id);
    }
  }

  if (story && sMembers.length > 0 && cMembers.length > 0) {
    const inStory = new Set(sMembers.map((row) => row.id));
    const missing = cMembers.filter((row) => !inStory.has(row.id)).map((row) => row.id);
    if (missing.length > 0) {
      const sims = await nearestStorySims(db, story.id, missing);
      cMembers = cMembers.map((row) => {
        const hit = sims.get(row.id);
        if (!hit) return row;
        return {
          ...row,
          vsStorySimilarity: hit.similarity,
          vsStoryNearestArticleId: hit.nearestArticleId,
        };
      });
    }
  }

  return {
    tab,
    q,
    run,
    dim,
    storyFreshness,
    lookup: {
      article,
      story,
      cluster,
      titleHits,
      storyMembers: sMembers,
      clusterMembers: cMembers,
    },
    splits: null,
  };
}

function majority(rows: MemberRow[], key: (row: MemberRow) => number | null) {
  const counts = new Map<number, { n: number; row: MemberRow }>();
  for (const row of rows) {
    const id = key(row);
    if (id == null) continue;
    const cur = counts.get(id) ?? { n: 0, row };
    cur.n += 1;
    counts.set(id, cur);
  }
  return [...counts.values()].toSorted((a, b) => b.n - a.n)[0]?.row ?? null;
}

function parseDbDate(value: string): Date | null {
  const iso = value.trim().replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function LocalTime({ value }: { value: string | null }) {
  if (!value) return "—";
  const date = parseDbDate(value);
  if (!date) return value;
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      })}
    </time>
  );
}

export default function CompareClusteringPage({
  loaderData,
}: Route.ComponentProps) {
  const { tab, q, run, dim, storyFreshness, lookup, splits } = loaderData;

  return (
    <div className="text-surface-text space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Compare <code className="font-mono text-[0.85em]">story</code> vs{" "}
          <code className="font-mono text-[0.85em]">cluster_v2</code> +{" "}
          <code className="font-mono text-[0.85em]">cluster_run</code>
        </h1>
        {run ? (
          <p className="text-surface-text/60 mt-2 text-xs">
            Latest production run #{run.id} · {run.algoVersion} ·{" "}
            <LocalTime value={run.createdAt} />
          </p>
        ) : (
          <p className="mt-2 text-sm text-red-500">
            No production cluster_run.
          </p>
        )}
        <p className="text-surface-text/60 mt-1 text-xs">
          Stories: last assignment{" "}
          <LocalTime value={storyFreshness.lastAssignedAt} /> · newest story{" "}
          <LocalTime value={storyFreshness.lastCreatedAt} />
        </p>
      </div>

      <nav className="flex gap-3 text-sm">
        <Link
          to="/dev/compare-clustering"
          className={
            tab === "lookup" ? "font-semibold underline" : "opacity-70"
          }
        >
          Lookup
        </Link>
        <Link
          to="/dev/compare-clustering?tab=splits"
          className={
            tab === "splits" ? "font-semibold underline" : "opacity-70"
          }
        >
          Splits
        </Link>
      </nav>

      {tab === "lookup" ? (
        <>
          <form
            method="get"
            action="/dev/compare-clustering"
            className="flex flex-wrap gap-2"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Article URL, id, /zgodba/123, clanek slug, or title"
              className="border-primary/20 bg-surface min-w-60 flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-primary text-primary-text rounded-md px-4 py-2 text-sm"
            >
              Search
            </button>
          </form>
          {lookup ? <LookupResults lookup={lookup} run={run} q={q} /> : null}
        </>
      ) : (
        splits && <SplitsResults splits={splits} />
      )}

      <IndexNotes dim={dim} />
    </div>
  );
}

function lookupHref(q: string) {
  return `/dev/compare-clustering?q=${encodeURIComponent(q)}`;
}

function LookupResults({
  lookup,
  run,
  q,
}: {
  lookup: NonNullable<Route.ComponentProps["loaderData"]["lookup"]>;
  run: RunInfo | null;
  q: string;
}) {
  const { article, story, cluster, titleHits, storyMembers, clusterMembers } =
    lookup;

  if (titleHits.length > 0) {
    return (
      <section>
        <h2 className="mb-2 text-lg font-semibold">Title matches (14 days)</h2>
        <ArticleTable rows={titleHits} />
      </section>
    );
  }

  if (!article && !story && !cluster) {
    return (
      <p className="text-surface-text/60 text-sm">
        No match. Try a source URL, article id, story id, or title.
      </p>
    );
  }

  const storyIds = new Set(storyMembers.map((m) => m.id));
  const clusterIds = new Set(clusterMembers.map((m) => m.id));
  const both = [...storyIds].filter((id) => clusterIds.has(id)).length;
  const onlyStory = storyIds.size - both;
  const onlyCluster = clusterIds.size - both;

  return (
    <div className="space-y-6">
      {article ? (
        <section className="bg-primary/5 border-primary/10 rounded-lg border p-4 text-sm">
          <div className="font-medium">{article.title}</div>
          <div className="text-surface-text/70 mt-1">
            #{article.id} · {article.providerName} ·{" "}
            <a
              href={article.url}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              source
            </a>
          </div>
          {article && !story && /^\d+$/.test(q) ? (
            <p className="mt-2 text-xs">
              This is article #{q}, not a story/cluster id.{" "}
              <Link
                to={lookupHref(`/zgodba/${q}`)}
                className="underline"
              >
                Try story #{q}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <EntityCard
          kind="story"
          title={story?.title ?? "No story"}
          hrefTo={
            story
              ? href("/zgodba/:storyId", { storyId: String(story.id) })
              : null
          }
          subtitle={
            story
              ? `#${story.id} · ${storyMembers.length} articles${story.method ? ` · ${story.method}` : ""}${story.similarity != null ? ` · sim ${story.similarity.toFixed(3)}` : ""}`
              : run
                ? "Not in story_article"
                : null
          }
        />
        <EntityCard
          kind="cluster"
          title={cluster?.title ?? "No cluster in this run"}
          hrefTo={
            cluster
              ? clanekPath(
                  clusterMembers[0]?.categories ?? article?.categories ?? null,
                  cluster.slug ?? cluster.id,
                )
              : null
          }
          subtitle={
            cluster
              ? `#${cluster.id} · run ${cluster.runId} · ${clusterMembers.length} articles`
              : null
          }
        />
      </div>

      {story && cluster ? (
        <p className="text-sm">
          Overlap {both} · only story {onlyStory} · only cluster {onlyCluster}
        </p>
      ) : null}
      <p className="text-surface-text/60 text-xs">
        Story <code className="font-mono">similarity</code> is cosine vs{" "}
        <code className="font-mono">nearest_article_id</code> at assignment (
        <code className="font-mono">seed</code> = first article,{" "}
        <code className="font-mono">cosine</code> = joined by that score).{" "}
        <code className="font-mono">cluster_v2</code> stores none; amber
        cluster-only rows show live cosine vs the nearest current story member.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold">Story articles</h2>
          <MemberTable
            rows={storyMembers}
            highlight={clusterIds}
            side="story"
          />
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">Cluster articles</h2>
          <MemberTable
            rows={clusterMembers}
            highlight={storyIds}
            side="cluster"
          />
        </section>
      </div>
    </div>
  );
}

function EntityCard({
  kind,
  title,
  hrefTo,
  subtitle,
}: {
  kind: "story" | "cluster";
  title: string;
  hrefTo: string | null;
  subtitle: string | null;
}) {
  return (
    <div className="border-primary/10 rounded-lg border p-4">
      <div className="text-surface-text/50 text-xs uppercase">{kind}</div>
      <div className="mt-1 font-medium">
        {hrefTo ? (
          <Link to={hrefTo} className="underline">
            {title}
          </Link>
        ) : (
          title
        )}
      </div>
      {subtitle ? (
        <div className="text-surface-text/60 mt-1 text-xs">{subtitle}</div>
      ) : null}
    </div>
  );
}

function ArticleTable({ rows }: { rows: ArticleRow[] }) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="w-full">
        <thead className="text-left opacity-60">
          <tr>
            <th className="py-1 pr-2">id</th>
            <th className="py-1 pr-2">title</th>
            <th className="py-1">open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-primary/10 border-t">
              <td className="py-1 pr-2 align-top">{row.id}</td>
              <td className="py-1 pr-2">{row.title}</td>
              <td className="py-1 whitespace-nowrap">
                <Link
                  to={lookupHref(String(row.id))}
                  className="underline"
                >
                  compare
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberTable({
  rows,
  highlight,
  side,
}: {
  rows: MemberRow[];
  highlight: Set<number>;
  side: "story" | "cluster";
}) {
  if (rows.length === 0) {
    return <p className="text-surface-text/50 text-sm">Empty.</p>;
  }
  return (
    <div className="overflow-x-auto text-xs">
      <table className="w-full">
        <thead className="text-left opacity-60">
          <tr>
            <th className="py-1 pr-2">id</th>
            <th className="py-1 pr-2">title</th>
            <th className="py-1">{side === "story" ? "cluster" : "story"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const inBoth = highlight.has(row.id);
            return (
              <tr
                key={row.id}
                className={`border-primary/10 border-t ${inBoth ? "" : "bg-amber-500/10"}`}
              >
                <td className="py-1 pr-2 align-top">
                  <Link
                    to={lookupHref(String(row.id))}
                    className="underline"
                  >
                    {row.id}
                  </Link>
                </td>
                <td className="py-1 pr-2">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {row.title}
                  </a>
                  {side === "story" && row.method ? (
                    <div className="opacity-50">
                      {row.method}
                      {row.similarity != null
                        ? ` ${row.similarity.toFixed(3)}`
                        : ""}
                      {row.nearestArticleId != null
                        ? ` → #${row.nearestArticleId}`
                        : ""}
                    </div>
                  ) : null}
                  {side === "cluster" && row.vsStorySimilarity != null ? (
                    <div className="opacity-50">
                      vs story {row.vsStorySimilarity.toFixed(3)}
                      {row.vsStoryNearestArticleId != null
                        ? ` → #${row.vsStoryNearestArticleId}`
                        : ""}
                    </div>
                  ) : null}
                </td>
                <td className="py-1 align-top">
                  {side === "story" ? (
                    row.clusterId ? (
                      <Link
                        to={lookupHref(
                          row.clusterSlug ?? String(row.clusterId),
                        )}
                        className="underline"
                      >
                        #{row.clusterId}
                      </Link>
                    ) : (
                      "—"
                    )
                  ) : row.storyId ? (
                    <Link
                      to={lookupHref(`/zgodba/${row.storyId}`)}
                      className="underline"
                    >
                      #{row.storyId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SplitsResults({
  splits,
}: {
  splits: {
    stories: SplitStory[];
    clusters: SplitCluster[];
    unmatched: {
      clusterArticlesWithoutStory: number;
      recentStoryArticlesWithoutCluster: number;
    };
  };
}) {
  return (
    <div className="space-y-8 text-sm">
      <p>
        Latest-run cluster articles with no story:{" "}
        <strong>{splits.unmatched.clusterArticlesWithoutStory}</strong>
        <br />
        Story articles (14d) with no cluster in that run:{" "}
        <strong>{splits.unmatched.recentStoryArticlesWithoutCluster}</strong>
      </p>
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Stories split across multiple clusters
        </h2>
        <table className="w-full">
          <thead className="text-left opacity-60">
            <tr>
              <th className="py-1 pr-2">story</th>
              <th className="py-1 pr-2">clusters</th>
              <th className="py-1">articles</th>
            </tr>
          </thead>
          <tbody>
            {splits.stories.map((row) => (
              <tr key={row.id} className="border-primary/10 border-t">
                <td className="py-1 pr-2">
                  <Link
                    to={lookupHref(`/zgodba/${row.id}`)}
                    className="underline"
                  >
                    #{row.id} {row.title}
                  </Link>
                </td>
                <td className="py-1 pr-2">{row.clusterCount}</td>
                <td className="py-1">{row.articleCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {splits.stories.length === 0 ? (
          <p className="opacity-50">None in the 14-day window.</p>
        ) : null}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Clusters split across multiple stories
        </h2>
        <table className="w-full">
          <thead className="text-left opacity-60">
            <tr>
              <th className="py-1 pr-2">cluster</th>
              <th className="py-1 pr-2">stories</th>
              <th className="py-1">articles</th>
            </tr>
          </thead>
          <tbody>
            {splits.clusters.map((row) => (
              <tr key={row.id} className="border-primary/10 border-t">
                <td className="py-1 pr-2">
                  <Link
                    to={lookupHref(row.slug ?? String(row.id))}
                    className="underline"
                  >
                    #{row.id} {row.title}
                  </Link>
                </td>
                <td className="py-1 pr-2">{row.storyCount}</td>
                <td className="py-1">{row.articleCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {splits.clusters.length === 0 ? (
          <p className="opacity-50">None in the latest production run.</p>
        ) : null}
      </section>
    </div>
  );
}

function IndexNotes({ dim }: { dim: number | null }) {
  const vectorType = dim ? `vector(${dim})` : "vector(<dim>)";
  return (
    <details className="border-primary/10 text-surface-text/80 rounded-lg border p-4 text-xs">
      <summary className="cursor-pointer text-sm font-medium">
        Indexes to add in the scraper repo
      </summary>
      <p className="mt-3">
        Schema/migrations live in the scraper, not here. These queries are what
        this page cannot do well today.
      </p>
      <pre className="bg-surface-light mt-3 overflow-x-auto rounded p-3 leading-5">
        {`-- Title search (ILIKE / %term%) — currently limited to 14 days
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX ix_article_title_trgm
  ON article USING gin (title gin_trgm_ops);

-- Article → cluster for a given run
-- unique(article_id, cluster_id, run_id) exists; this matches the real lookup
CREATE INDEX ix_article_cluster_article_id_run_id
  ON article_cluster (article_id, run_id);

-- Semantic nearest-neighbour on article.embedding
-- Column is double precision[] today. Change it to pgvector, then HNSW.
-- embedding dim from a live row: ${dim ?? "unknown"}
ALTER TABLE article
  ALTER COLUMN embedding TYPE ${vectorType}
  USING embedding::${vectorType};
CREATE INDEX ix_article_embedding_hnsw
  ON article USING hnsw (embedding vector_cosine_ops);`}
      </pre>
    </details>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
