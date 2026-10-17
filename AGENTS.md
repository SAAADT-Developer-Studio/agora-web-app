# Vidik Web App — Agent Guide

**Vidik** (vidik.si) is a Slovenian news aggregation and media bias rating platform. The repo is named `agora-web-app`; user-facing branding is always **Vidik**. UI copy and routes are in Slovenian (`lang="sl"`).

## Stack & deployment

- **React Router 7** SSR app deployed as a **Cloudflare Worker** (`workers/app.ts` via `@cloudflare/vite-plugin`).
- **PostgreSQL** accessed at runtime through **Hyperdrive** (`env.HYPERDRIVE.connectionString`). Local dev uses `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `.env` (append `?sslmode=require` for remote hosts).
- **KV** (`VIDIK_CACHE`) for application-level caching; **Worker Cache API** (`custom:vidik-page-cache`) for full-page HTML caching.

## Database

- Schema lives in `app/drizzle/schema.ts` and is **read-only in this repo**. The scraper repository owns migrations and schema changes.
- Sync schema from production: `pnpm run db:pull`.
- `DB_URL` (+ optional `DB_CERT`) is for **drizzle-kit only** (`db:pull`, `db:studio`). The running app never reads `DB_URL`.
- `drizzle.config.ts` parses `DB_URL` into discrete fields because passing `url` overrides SSL config.

## Caching model

Three coordinated layers — understand this before changing loaders or cache TTLs:

1. **KV cache** (`KVCache` in `app/lib/kvCache/`): precomputed article data for home and category pages. Keys are env-prefixed (`dev:`, `preview:`, `prod:`). Home/category loaders read via `kvCache.cached()` with a 10-minute TTL.
2. **`POST /api/populate-cache`**: warms KV for home + all categories (30-minute TTL) and writes `META_CACHE_KEY` with `lastUpdated`. Intended to be triggered by the scraper after new articles land. **Currently unprotected** — there is an open TODO to add auth.
3. **HTTP `Cache-Control`**: `getMaxAge()` ties browser/CDN cache lifetime to `META_CACHE_KEY.lastUpdated` so pages go stale shortly after a cache refresh.

Changing article-fetch logic usually means updating both the loader and `fetchHomeArticlesData` / `fetchCategoryArticlesData` (shared with `populate-cache`).

## Request context

`workers/app.ts` injects `AppLoadContext`: `{ cloudflare, db, kvCache, measurer }`. Loaders and actions receive these via `context`. `Measurer` adds `Server-Timing` headers for performance debugging.

## Routing & config

- Route definitions: `app/routes.ts`. Public URL segments are Slovenian (`/mediji`, `/metodologija`, `/zgodba/:storyId`). `/:category/clanek/:articleId` permanently redirects to the story. Hidden, unlisted route: `/novo` (story-ranked home). `/dev/*` is English and internal.
- **Categories**: keys live only in `app/config.ts` (`CategoryKey` / `CategoryKeyValue`). Domain configs (nav metadata, SEO, ranking priority, home side sections) must use `defineCategoryMap()` / `CategoryMap<T>` so TypeScript fails if a key is added without updating every map. Use `isCategoryKey()` for runtime checks — don't rebuild category sets ad hoc.
- Article images: `config.imagesUrl` (`https://images.vidik.si`).
- React Router route modules cannot import other route modules. Shared UI belongs in `app/components/` (e.g. `article-page.tsx` used by zgodba).

## Clustering (story vs cluster_v2)

Two systems coexist on purpose:

- **Public listings** (`/` and `/:category`) rank `cluster_v2` from the latest production `cluster_run` and link to `/zgodba/:storyId` when the cluster maps to a story. Unmapped cards still use `/:category/clanek/:articleId`, which 301s. KV keys stay `data:v2:home` and `data:v2:category:{category}`.
- **Hidden listings** (`/novo`) rank `story` + `story_article` (14-day `last_article_published_at` window) and link to `/zgodba/:storyId`. KV key is `data:story:novo` (`NOVO_HOME_CACHE_KEY`) so it never collides with the public home cache.
- **Story pages** `/zgodba/:storyId` are the permanent public article URL (`story.id` does not change across ranking runs). They are indexable and listed in the sitemap. `/:category/clanek/:articleId` 301s here.
- `/novo` is unlisted: `noindex, nofollow` meta, `X-Robots-Tag`, `Disallow` in robots.txt, and omitted from the sitemap. No public page links to it.
- Story ids and cluster ids are different namespaces — the same number is not the same entity.
- Stories are incremental (no `cluster_run`). Closest clocks: `story_article.assigned_at`, `story.created_at`.
- `story_article.similarity` is cosine vs `nearest_article_id` at assign time (`method` `seed` | `cosine`). `article_cluster` has no scores; live cosine is `article.embedding` (float8[]).

`ArticleType.to` is the card href. `/novo` and public listings set it to `/zgodba/{id}` when a story id is known. Changing the `/novo` URL shape requires bumping `NOVO_HOME_CACHE_KEY` in `app/lib/kvCache/keys.ts`.

## Dev tools

`/dev/*` uses `app/routes/dev-layout.tsx` (no site header/footer), is noindexed, and is skipped from the Worker page cache (`pathname.startsWith("/dev")` in `workers/app.ts`). English copy is allowed there. Clustering explorer: `/dev/compare-clustering`. Indexes that page needs (trigram title search, HNSW on `article.embedding`) belong in the scraper repo.

## UI conventions

- **Tailwind CSS 4** + **shadcn/ui** components in `app/components/ui/`. Add components: `pnpm dlx shadcn@latest add [name]`.
- Generic icons: `lucide-react`. Custom SVGs: use `app/components/icon.tsx` — the source SVG must have `id="icon"`. Optimize SVGs with [svgomg](https://jakearchibald.github.io/svgomg/).
- Bias ratings use `BiasRatingKey` enum (`left`, `center-left`, `center`, `center-right`, `right`). Color/label helpers: `app/utils/biasKeyToColor.ts`, `biasKeyToLabel.ts`.
- SEO: use `getSeoMetas()` from `app/lib/seo`. Default locale `sl-SI`, canonical base `https://vidik.si`.

## Commands

```bash
pnpm install          # install deps
pnpm dev              # dev server at http://localhost:5173
pnpm build            # production build
pnpm preview          # preview production build
pnpm typecheck        # cf-typegen + react-router typegen + tsc
pnpm lint              # oxlint
pnpm run db:pull      # sync schema from production DB
pnpm run db:studio    # drizzle studio (needs DB_URL)
```

## What not to do

- Don't add migrations, edit `app/drizzle/schema.ts` by hand, or run `drizzle-kit push` — schema changes belong in the scraper repo.
- Don't assume `DB_URL` is available at runtime; only Hyperdrive connection strings are used in the Worker.
- Don't add English **product** copy unless explicitly requested — the public site is Slovenian-first. `/dev/*` is English.
