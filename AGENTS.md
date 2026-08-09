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

- Route definitions: `app/routes.ts`. URL segments are Slovenian (`/mediji`, `/metodologija`, `/clanek/:articleId`, etc.).
- **Categories** are defined once in `app/config.ts` (`CategoryKey`, paths, navigation). Add a category there and wire up the route — don't hardcode category lists elsewhere.
- Article images: `config.imagesUrl` (`https://images.vidik.si`).

## UI conventions

- **Tailwind CSS 4** + **shadcn/ui** (`base-nova`) components live in `app/components/ui/`. Interactive shadcn components use **Base UI**, not Radix. Use Base UI's `render` prop for element composition; do not introduce `asChild` or direct Radix dependencies.
- Add or refresh components with `pnpm dlx shadcn@latest add [name]`. The semantic shadcn tokens are mapped to the Vidik theme in `app/app.css`; keep that mapping intact and never paste stock shadcn theme variables over it.
- Generic icons: `lucide-react`. Custom SVGs: use `app/components/icon.tsx` — the source SVG must have `id="icon"`. Optimize SVGs with [svgomg](https://jakearchibald.github.io/svgomg/).
- Bias ratings use `BiasRatingKey` enum (`left`, `center-left`, `center`, `center-right`, `right`). Color/label helpers: `app/utils/biasKeyToColor.ts`, `biasKeyToLabel.ts`.
- SEO: use `getSeoMetas()` from `app/lib/seo`. Default locale `sl-SI`, canonical base `https://vidik.si`.

### Design system

- **Semantic colors:** Prefer shadcn utilities such as `bg-background`, `bg-card`, `bg-popover`, `text-foreground`, `text-muted-foreground`, `bg-accent`, `border-border`, and `ring-ring`. `surface*` and `primary-text` remain compatibility aliases for older layouts; new components should use semantic names.
- **Typography:** Inter is the UI and body face (`font-sans`). Sarabun (`font-sarabun`) is reserved for the Vidik wordmark/brand treatment. Use the existing responsive type scale; body copy is normally `text-sm`/`text-base`, section headings `text-xl`/`text-2xl`, and page titles up to `text-4xl`/`text-5xl`.
- **Spacing and shape:** Use the Tailwind 4-point spacing scale. Controls are generally `h-8` or `h-9`, compact groups use `gap-1.5`/`gap-2`, card interiors use `p-4` (or `p-6` for editorial content), and page sections use `gap-4`/`gap-6`. The default radius is `0.625rem`; controls use `rounded-lg` and content cards use `rounded-xl`.
- **Cards and overlays:** Build generic cards with `app/components/ui/card.tsx`; use `InfoCard` and `SideCardContainer` only for their established editorial layouts. Use `bg-card text-card-foreground` for cards and `bg-popover text-popover-foreground` for floating content. Prefer a subtle `border-border`/ring and `shadow-vidik` over hard-coded gray borders or shadows.
- **Bias colors:** Use only `bias-left`, `bias-center-left`, `bias-center`, `bias-center-right`, and `bias-right` tokens, in that order from red to blue. Use `biasKeyToColor()` for rating badges. Center and center-adjacent light fills need dark text; do not use bias colors as generic success/error decoration.
- **Dark mode:** Every new surface, text, border, and focus state must use semantic tokens so the `.dark` overrides work automatically. Verify popovers, dialogs, selects, focus rings, disabled states, and destructive states in both themes.
- **Copy and accessibility:** User-facing copy and accessible labels are Slovenian. Keep keyboard focus visible, use semantic controls, and preserve Base UI's accessible structure when restyling primitives.

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
- Don't add English user-facing copy unless explicitly requested — the product is Slovenian-first.
