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

- **Tailwind CSS 4** + **shadcn/ui (Base UI)** components in `app/components/ui/`.
- Style is `base-nova` in `components.json` (Base UI primitives via `@base-ui/react`, not Radix).
- Add components: `pnpm dlx shadcn@latest add [name]` — only after confirming tokens below are intact.
- Generic icons: `lucide-react`. Custom SVGs: use `app/components/icon.tsx` — the source SVG must have `id="icon"`. Optimize SVGs with [svgomg](https://jakearchibald.github.io/svgomg/).
- Bias ratings use `BiasRatingKey` enum (`left`, `center-left`, `center`, `center-right`, `right`). Color/label helpers: `app/utils/biasKeyToColor.ts`, `biasKeyToLabel.ts`.
- SEO: use `getSeoMetas()` from `app/lib/seo`. Default locale `sl-SI`, canonical base `https://vidik.si`.
- Base UI uses `render={...}` instead of Radix `asChild` when composing triggers with custom elements (e.g. `Link`, `Button`).

### Design system (tokens & patterns)

Defined in `app/app.css`. Brand/surface tokens are the source of truth; shadcn semantic tokens are mapped onto them so generated components match Vidik in light and dark mode.

**Typography**

| Role | Font | Utility / token |
|------|------|-----------------|
| Body / UI | Source Sans 3 (fallback Inter) | `--font-sans`, default on `body` |
| Brand / logo wordmark | Sarabun (500–700) | `font-sarabun` / `--font-sarabun` |

Fonts are loaded in `app/root.tsx` from Google Fonts. Do not set `--font-sans` to a family that is not linked there.

**Color tokens**

| Token family | Purpose | Examples |
|--------------|---------|----------|
| Surfaces | Page & elevated panels | `bg-surface`, `bg-surface-light`, `text-surface-text` |
| Brand | Logo, header, ink | `vidikwhite`, `vidikblack`, `vidikdarkgray`, `vidiklightgray`, `vidikgreen` |
| Bias / accent | Coverage bars, CTAs | `leftred`, `rightblue`, `centerwhite`, `electricblue` |
| shadcn semantic | Generated UI primitives | `background`/`foreground`, `primary`/`primary-foreground`, `muted`, `accent`, `popover`, `destructive`, `border`, `input`, `ring` |

Legacy alias: `text-primary-text` / `bg-primary-text` maps to `primary-foreground` (button label on primary fills).

**Bias colors** (also in `biasKeyToColor`)

- left `#FA2D36`, center-left `#FF6166`, center `#FEFFFF` (+ subtle border), center-right `#52A1FF`, right `#2D7EFF`
- Prefer the helper over hardcoding; keep left=red / right=blue semantics.

**Spacing & cards**

- Page gutters: prefer existing route layouts (`container`, `px-4` / `md:` scales already in routes).
- Cards: `Card` uses `bg-surface-light` + light border/shadow. Prefer flat surfaces over nested card stacks. Hero/article media should stay full-bleed where the layout already does that — do not invent inset media cards.
- Elevation: `shadow-vidik` for menus/filters that need a light lift.

**Dark mode**

- Toggled via `.dark` on `<html>` (`ThemeSwitch`). All semantic and Vidik tokens have `.dark` overrides in `app/app.css`.
- After adding a shadcn component, check hover/focus states for undefined tokens (`muted`, `accent`, `popover`, etc.) — they must resolve through the mapped theme.

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
